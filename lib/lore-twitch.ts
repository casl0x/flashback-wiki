import "server-only";

import type { LoreVersionView } from "@/lib/lore";
import { twitchHelix } from "@/lib/twitch";
import { unstable_cache } from "next/cache";

// Aperçus des clips Twitch du Lore : miniature et titre, lus via l'API Helix.
// Fichier séparé de lib/lore.ts (importé aussi côté navigateur) à cause de « server-only ».

type HelixClip = { id: string; title: string; thumbnail_url: string };
type ClipInfo = { thumbnail: string | null; title: string | null };

// Les miniatures changent peu : on interroge Twitch au plus toutes les 6 h par lot de clips.
const fetchClipInfos = unstable_cache(
  async (slugs: string[]) => {
    const out: Record<string, ClipInfo> = {};
    for (let i = 0; i < slugs.length; i += 100) {
      const params = new URLSearchParams();
      slugs.slice(i, i + 100).forEach((s) => params.append("id", s));
      const { data } = await twitchHelix<HelixClip>("clips", params);
      for (const c of data ?? []) {
        out[c.id] = { thumbnail: c.thumbnail_url || null, title: c.title || null };
      }
    }
    return out;
  },
  ["lore-twitch-clips"],
  { revalidate: 6 * 60 * 60 },
);

/**
 * Ajoute miniature et titre aux clips Twitch. Si Twitch ne répond pas (clés absentes,
 * panne, clip supprimé), les clips restent tels quels, avec leur fond de remplacement.
 */
export async function withTwitchPreviews(versions: LoreVersionView[]): Promise<LoreVersionView[]> {
  const slugs = [
    ...new Set(
      versions.flatMap((v) =>
        v.events.flatMap((e) =>
          e.clips.flatMap((c) => (c.platform === "twitch" && c.embedId ? [c.embedId] : [])),
        ),
      ),
    ),
  ].sort();
  if (slugs.length === 0) return versions;

  let infos: Record<string, ClipInfo>;
  try {
    infos = await fetchClipInfos(slugs);
  } catch (error) {
    console.error("Aperçus des clips Twitch indisponibles", error);
    return versions;
  }

  return versions.map((v) => ({
    ...v,
    events: v.events.map((e) => ({
      ...e,
      clips: e.clips.map((c) => {
        const info = c.platform === "twitch" && c.embedId ? infos[c.embedId] : undefined;
        return info ? { ...c, thumbnail: info.thumbnail, autoTitle: info.title } : c;
      }),
    })),
  }));
}
