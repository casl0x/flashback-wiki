import type { EtatVie, VersionTag } from "@/lib/character-page";
import { prisma } from "@/lib/db";
import { toTracks, type MusicTrack } from "@/lib/music";
import { toPlayerChannel, type PlayerChannel } from "@/lib/utils";
import { versionRank } from "@/lib/version-rank";
import { unstable_cache } from "next/cache";

export type { EtatVie, VersionTag };

const NONE = "__none__";

// ─── Liste des joueurs (page /joueurs) ───────────────────────────────────────

export type PlayerListItem = {
  id: string;
  pseudo: string;
  chaines: PlayerChannel[];
  badges: string[];
  imageUrl: string | null;
  characterCount: number;
};

async function loadPlayersList(): Promise<PlayerListItem[]> {
  try {
    const players = await prisma.player.findMany({
      orderBy: { pseudo: "asc" },
      include: { _count: { select: { characters: true } } },
    });

    return players.map((p) => ({
      id: p.id,
      pseudo: p.pseudo.trim() || "Joueur",
      chaines: p.chaines.map(toPlayerChannel),
      badges: p.badges,
      imageUrl: p.imageUrl,
      characterCount: p._count.characters,
    }));
  } catch (error) {
    console.error("Failed to load players list", error);
    return [];
  }
}

export const getPlayersList = unstable_cache(loadPlayersList, ["players-list"], {
  revalidate: 300,
  tags: ["wiki-data"],
});

// ─── Fiche joueur (page /joueurs/[id]) ───────────────────────────────────────

export type PlayerCharacterCard = {
  id: string;
  nom: string;
  imageUrl: string | null;
  etatVie: EtatVie;
  // "grade · groupe" de l'appartenance pour cette version, sinon le métier.
  subtitle: string | null;
};

export type PlayerVersionRow = {
  key: string;
  version: VersionTag | null;
  characters: PlayerCharacterCard[];
};

export type PlayerBannerCharacter = {
  id: string;
  imageUrl: string | null;
  etatVie: EtatVie;
  version: VersionTag | null;
};

export type PlayerPageData = {
  id: string;
  pseudo: string;
  chaines: PlayerChannel[];
  reseaux: Record<string, string>;
  badges: string[];
  imageUrl: string | null;
  characterCount: number;
  versionCount: number;
  rows: PlayerVersionRow[];
  bannerCharacters: PlayerBannerCharacter[];
  tracks: MusicTrack[];
};

const toVersionTag = (v: {
  id: string;
  label: string;
  color: string;
}): VersionTag => ({ id: v.id, label: v.label, color: v.color });

const normalizeReseaux = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1] !== "",
    ),
  );
};

async function loadPlayerPage(id: string): Promise<PlayerPageData | null> {
  try {
    return await loadPlayerPageUnsafe(id);
  } catch (error) {
    console.error("Failed to load player page", error);
    return null;
  }
}

async function loadPlayerPageUnsafe(id: string): Promise<PlayerPageData | null> {
  const p = await prisma.player.findUnique({
    where: { id },
    include: {
      characters: {
        orderBy: { nom: "asc" },
        include: {
          versions: true,
          sounds: { orderBy: [{ ordre: "asc" }, { createdAt: "asc" }] },
          groupes: { include: { groupe: true, grade: true } },
        },
      },
    },
  });

  if (!p) return null;

  const rows = new Map<string, PlayerVersionRow>();
  const versionIds = new Set<string>();

  for (const c of p.characters) {
    const versions = c.versions.length ? c.versions : [null];
    for (const v of versions) {
      const key = v ? v.id : NONE;
      if (!rows.has(key)) {
        rows.set(key, { key, version: v ? toVersionTag(v) : null, characters: [] });
      }
      if (v) versionIds.add(v.id);

      const last = c.groupes
        .filter((m) => (v ? m.versionId === v.id : m.versionId === null))
        .sort((a, b) => a.ordre - b.ordre)
        .at(-1);
      const subtitle = last
        ? last.grade
          ? `${last.grade.nom} · ${last.groupe.nom}`
          : last.groupe.nom
        : null;

      rows.get(key)!.characters.push({
        id: c.id,
        nom: c.nom,
        imageUrl: c.imageUrl,
        etatVie: c.etatVie as EtatVie,
        subtitle,
      });
    }
  }

  const rankFor = (key: string) => (key === NONE ? -1 : versionRank(key));
  const sortedRows = [...rows.values()]
    .map((r) => ({
      ...r,
      characters: [...r.characters].sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    }))
    .sort((a, b) => rankFor(b.key) - rankFor(a.key));

  const byCharacterId = new Map<string, (typeof p.characters)[number]>();
  for (const c of p.characters) byCharacterId.set(c.id, c);

  const bannerCharacters: PlayerBannerCharacter[] = [...byCharacterId.values()]
    .filter((c) => c.imageUrl)
    .map((c) => {
      const v = [...c.versions].sort((a, b) => versionRank(a.id) - versionRank(b.id)).at(-1);
      return {
        id: c.id,
        imageUrl: c.imageUrl,
        etatVie: c.etatVie as EtatVie,
        version: v ? toVersionTag(v) : null,
      };
    })
    .sort((a, b) => versionRank(b.version?.id) - versionRank(a.version?.id))
    .slice(0, 6);

  return {
    id: p.id,
    pseudo: p.pseudo.trim() || "Joueur",
    chaines: p.chaines.map(toPlayerChannel),
    reseaux: normalizeReseaux(p.reseaux),
    badges: p.badges,
    imageUrl: p.imageUrl,
    characterCount: p.characters.length,
    versionCount: versionIds.size,
    rows: sortedRows,
    bannerCharacters,
    tracks: toTracks(p.characters),
  };
}

export const getPlayerPage = unstable_cache(loadPlayerPage, ["player-page"], {
  revalidate: 300,
  tags: ["wiki-data"],
});

export { cloudinaryUrl, initials } from "@/lib/cloudinary";
