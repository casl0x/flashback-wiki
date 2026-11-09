import { prisma } from "@/lib/db";
import { versionRank } from "@/lib/version-rank";

// ─── Badges par version du serveur ───────────────────────────────────────────
// Calculés à la volée (jamais stockés) : un membre a le badge d'une version
// s'il a contribué à un personnage présent dans cette version.
//  - contributeur : proposition acceptée ou points attribués sur ce perso
//  - créateur     : création approuvée (fan art / edit) qui mentionne ce perso

export type VersionBadge = { id: string; label: string; color: string };

export type VersionBadges = {
  contributor: VersionBadge[];
  creator: VersionBadge[];
};

const EMPTY: VersionBadges = { contributor: [], creator: [] };

type VersionRow = { id: string; label: string; color: string };
type CharacterVersions = { versions: VersionRow[] };

const versionSelect = { select: { id: true, label: true, color: true } };

function add(
  map: Map<string, Map<string, VersionBadge>>,
  clerkUserId: string,
  character: CharacterVersions | null,
) {
  if (!character) return;
  let byVersion = map.get(clerkUserId);
  if (!byVersion) map.set(clerkUserId, (byVersion = new Map()));
  for (const v of character.versions) byVersion.set(v.id, v);
}

function sorted(m: Map<string, VersionBadge> | undefined): VersionBadge[] {
  return [...(m?.values() ?? [])].sort(
    (a, b) => versionRank(a.id) - versionRank(b.id),
  );
}

/** Badges de version de plusieurs membres, en 3 requêtes. */
export async function getVersionBadges(
  clerkUserIds: string[],
): Promise<Map<string, VersionBadges>> {
  const out = new Map<string, VersionBadges>();
  if (!clerkUserIds.length) return out;

  const [suggestions, entries, posts] = await Promise.all([
    prisma.suggestion.findMany({
      where: {
        clerkUserId: { in: clerkUserIds },
        status: "accepted",
        characterId: { not: null },
      },
      select: {
        clerkUserId: true,
        character: { select: { versions: versionSelect } },
      },
    }),
    prisma.pointEntry.findMany({
      where: {
        userProfile: { clerkUserId: { in: clerkUserIds } },
        characterId: { not: null },
      },
      select: {
        userProfile: { select: { clerkUserId: true } },
        character: { select: { versions: versionSelect } },
      },
    }),
    prisma.creatorPost.findMany({
      where: {
        creatorRole: {
          status: "approved",
          userProfile: { clerkUserId: { in: clerkUserIds } },
        },
      },
      select: {
        creatorRole: {
          select: { userProfile: { select: { clerkUserId: true } } },
        },
        characters: {
          select: { character: { select: { versions: versionSelect } } },
        },
      },
    }),
  ]);

  const contributor = new Map<string, Map<string, VersionBadge>>();
  const creator = new Map<string, Map<string, VersionBadge>>();

  for (const s of suggestions) add(contributor, s.clerkUserId!, s.character);
  for (const e of entries) add(contributor, e.userProfile.clerkUserId, e.character);
  for (const p of posts)
    for (const c of p.characters)
      add(creator, p.creatorRole.userProfile.clerkUserId, c.character);

  for (const id of clerkUserIds) {
    out.set(id, {
      contributor: sorted(contributor.get(id)),
      creator: sorted(creator.get(id)),
    });
  }
  return out;
}

export async function getVersionBadgesFor(
  clerkUserId: string,
): Promise<VersionBadges> {
  return (await getVersionBadges([clerkUserId])).get(clerkUserId) ?? EMPTY;
}
