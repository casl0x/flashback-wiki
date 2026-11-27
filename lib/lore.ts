import { prisma, withDbRetry } from "@/lib/db";
import { groupeHref } from "@/lib/groupe-types";
import { visibleCharacter } from "@/lib/hidden-characters";
import { youtubeThumbnail, youtubeVideoId } from "@/lib/media-embed";

// ─── Lore : événements marquants par version (Explorer > Lore) ───────────────

export type ClipPlatform = "youtube" | "twitch" | "kick" | "other";

/** Clip tel que stocké en base : titre libre optionnel. */
export type LoreClipInput = { url: string; titre: string | null };

export type LoreClip = LoreClipInput & {
  platform: ClipPlatform;
  /** Miniature quand la plateforme en donne une sans API (YouTube). */
  thumbnail: string | null;
  /** Titre donné par la plateforme (clips Twitch), utilisé si aucun titre n'est saisi. */
  autoTitle: string | null;
  /** Identifiant d'intégration : id vidéo YouTube ou slug de clip Twitch. */
  embedId: string | null;
};

const safeUrl = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

/** Slug d'un clip Twitch (clips.twitch.tv/<slug> ou twitch.tv/<chaîne>/clip/<slug>). */
export function twitchClipSlug(url: string): string | null {
  const u = safeUrl(url);
  if (!u) return null;
  if (u.hostname === "clips.twitch.tv") return u.pathname.split("/").filter(Boolean)[0] ?? null;
  if (u.hostname.endsWith("twitch.tv")) {
    const m = u.pathname.match(/\/clip\/([\w-]+)/);
    return m?.[1] ?? null;
  }
  return null;
}

export function clipPlatform(url: string): ClipPlatform {
  const host = safeUrl(url)?.hostname ?? "";
  if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
  if (host.endsWith("twitch.tv")) return "twitch";
  if (host.endsWith("kick.com")) return "kick";
  return "other";
}

export const CLIP_PLATFORM_LABEL: Record<ClipPlatform, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  other: "Lien",
};

/** Lit la colonne Json `clips` en ignorant toute entrée mal formée. */
export function parseClipInputs(value: unknown): LoreClipInput[] {
  if (!Array.isArray(value)) return [];
  const out: LoreClipInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { url, titre } = item as { url?: unknown; titre?: unknown };
    if (typeof url !== "string" || !url.trim()) continue;
    out.push({
      url: url.trim(),
      titre: typeof titre === "string" && titre.trim() ? titre.trim() : null,
    });
  }
  return out;
}

export function toClip(c: LoreClipInput): LoreClip {
  const platform = clipPlatform(c.url);
  return {
    ...c,
    platform,
    thumbnail: platform === "youtube" ? youtubeThumbnail(c.url) : null,
    autoTitle: null,
    embedId:
      platform === "youtube"
        ? youtubeVideoId(c.url)
        : platform === "twitch"
          ? twitchClipSlug(c.url)
          : null,
  };
}

export type LoreKind = "EVENT" | "TEXT";

export type LoreEventView = {
  id: string;
  /** EVENT : carte de la frise. TEXT : bloc de texte mis en forme (lore hors gameplay). */
  kind: LoreKind;
  titre: string;
  resume: string;
  contenu: string | null;
  major: boolean;
  clips: LoreClip[];
  characters: { id: string; nom: string; href: string }[];
  groupes: { id: string; nom: string; href: string }[];
};

export type LoreVersionView = {
  id: string;
  label: string;
  color: string;
  /** Image d'ambiance de la version (carte du slider). */
  imageUrl: string | null;
  enCours: boolean;
  events: LoreEventView[];
};

/** Lore public : versions qui ont au moins une entrée, dans l'ordre défini en admin. */
export async function getLoreByVersion(): Promise<LoreVersionView[]> {
  const versions = await withDbRetry("getLoreByVersion", () =>
    prisma.version.findMany({
      where: { loreEvents: { some: {} } },
      select: {
        id: true,
        label: true,
        color: true,
        ordre: true,
        imageUrl: true,
        enCours: true,
        loreEvents: {
          orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            kind: true,
            titre: true,
            resume: true,
            contenu: true,
            major: true,
            clips: true,
            characters: {
              where: { character: { ...visibleCharacter } },
              select: { character: { select: { id: true, nom: true } } },
            },
            groupes: {
              select: { groupe: { select: { id: true, nom: true, slug: true, type: true } } },
            },
          },
        },
      },
    }),
  );

  // Même ordre que dans l'admin (Versions) et les bandes de l'accueil.
  return versions
    .sort((a, b) => a.ordre - b.ordre || a.id.localeCompare(b.id))
    .map((v) => ({
      id: v.id,
      label: v.label,
      color: v.color,
      imageUrl: v.imageUrl,
      enCours: v.enCours,
      events: v.loreEvents.map((e) => ({
        id: e.id,
        kind: e.kind,
        titre: e.titre,
        resume: e.resume,
        contenu: e.contenu,
        major: e.major,
        clips: parseClipInputs(e.clips).map(toClip),
        characters: e.characters
          .map((c) => c.character)
          .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
          .map((c) => ({ id: c.id, nom: c.nom, href: `/personnages/${c.id}` })),
        groupes: e.groupes
          .map((g) => g.groupe)
          .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
          .map((g) => ({ id: g.id, nom: g.nom, href: groupeHref(g) })),
      })),
    }));
}
