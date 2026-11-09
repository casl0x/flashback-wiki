import type { EtatVie, VersionTag } from "@/lib/character-page";
import { prisma } from "@/lib/db";
import {
  getVersionBadges,
  getVersionBadgesFor,
  type VersionBadge,
  type VersionBadges,
} from "@/lib/version-badges";
import { versionRank } from "@/lib/version-rank";
import { createClerkClient } from "@clerk/nextjs/server";
import { CreatorType, SocialPlatform } from "@prisma/client";
import { unstable_cache } from "next/cache";

// ─── Profils publics (/profil/[pseudo]) ──────────────────────────────────────
// Tout utilisateur ayant un pseudo a un profil public, sauf s'il l'a masqué.

export type PublicProfileData = {
  id: string;
  clerkUserId: string;
  pseudo: string;
  avatarUrl: string | null;
  bio: string | null;
  bannerColor: string | null;
  badges: string[];
  versionBadges: VersionBadges;
  /** null si l'utilisateur a choisi de masquer ses stats. */
  stats: { accepted: number; points: number; creations: number } | null;
  creatorTypes: CreatorType[];
  socialLinks: { platform: SocialPlatform; url: string }[];
  player: { id: string; pseudo: string } | null;
  characters: {
    id: string;
    nom: string;
    imageUrl: string | null;
    etatVie: EtatVie;
    version: Pick<VersionTag, "id" | "color"> | null;
  }[];
  posts: {
    id: string;
    type: CreatorType;
    imageUrl: string | null;
    linkUrl: string | null;
    platform: SocialPlatform | null;
    caption: string | null;
    characters: { id: string; nom: string }[];
  }[];
};

/** Recherche insensible à la casse : « bob » et « Bob » désignent le même pseudo. */
export function findProfileByPseudo(pseudo: string) {
  return prisma.userProfile.findFirst({
    where: { pseudo: { equals: pseudo.trim(), mode: "insensitive" } },
  });
}

/** Vrai si le pseudo est déjà pris par un autre compte que `clerkUserId`. */
export async function isPseudoTaken(pseudo: string, clerkUserId: string) {
  const other = await findProfileByPseudo(pseudo);
  return !!other && other.clerkUserId !== clerkUserId;
}

// `clerkClient()` lit les en-têtes de la requête, interdit dans `unstable_cache` :
// on passe par un client construit avec la clé secrète.
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function avatarOf(clerkUserId: string): Promise<string | null> {
  try {
    return (await clerk.users.getUser(clerkUserId)).imageUrl;
  } catch {
    return null;
  }
}

async function loadPublicProfile(
  pseudo: string,
): Promise<PublicProfileData | null> {
  const found = await findProfileByPseudo(pseudo);
  if (!found?.pseudo || !found.profilePublic) return null;

  const [profile, avatarUrl, versionBadges] = await Promise.all([
    prisma.userProfile.findUniqueOrThrow({
      where: { id: found.id },
      include: {
        player: { select: { id: true, pseudo: true } },
        socialLinks: true,
        creatorRoles: {
          include: {
            posts: {
              orderBy: { createdAt: "desc" },
              include: {
                characters: {
                  include: { character: { select: { id: true, nom: true } } },
                },
              },
            },
          },
        },
      },
    }),
    avatarOf(found.clerkUserId),
    getVersionBadgesFor(found.clerkUserId),
  ]);

  const characters = profile.playerId
    ? await prisma.character.findMany({
        where: { playerId: profile.playerId },
        orderBy: { nom: "asc" },
        select: {
          id: true,
          nom: true,
          imageUrl: true,
          etatVie: true,
          versions: { select: { id: true, color: true } },
        },
      })
    : [];

  const posts = profile.creatorRoles
    .flatMap((r) => r.posts)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    id: profile.id,
    clerkUserId: profile.clerkUserId,
    pseudo: profile.pseudo!,
    avatarUrl,
    bio: profile.bio,
    bannerColor: profile.bannerColor,
    badges: profile.badges,
    versionBadges,
    stats: profile.showStats
      ? {
          accepted: profile.acceptedCount,
          points: profile.totalPoints,
          creations: posts.length,
        }
      : null,
    creatorTypes: profile.creatorRoles.map((r) => r.type),
    socialLinks: profile.socialLinks.map((l) => ({
      platform: l.platform,
      url: l.url,
    })),
    player: profile.player,
    characters: characters.map((c) => ({
      id: c.id,
      nom: c.nom,
      imageUrl: c.imageUrl,
      etatVie: c.etatVie as EtatVie,
      version:
        [...c.versions]
          .sort((a, b) => versionRank(a.id) - versionRank(b.id))
          .at(-1) ?? null,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      type: p.type,
      imageUrl: p.imageUrl,
      linkUrl: p.linkUrl,
      platform: p.platform,
      caption: p.caption,
      characters: p.characters.map((c) => c.character),
    })),
  };
}

export const getPublicProfile = unstable_cache(
  loadPublicProfile,
  ["public-profile"],
  {
    revalidate: 300,
    tags: ["profiles"],
  },
);

// ─── Contributeurs d'une fiche personnage ────────────────────────────────────

export type Contributor = { pseudo: string; avatarUrl: string | null };

/**
 * Membres ayant une proposition acceptée sur ce perso, une création qui le
 * mentionne, ou des points attribués par un admin pour ce perso. Les profils masqués ne sont pas listés.
 */
async function loadCharacterContributors(
  characterId: string,
): Promise<Contributor[]> {
  const [suggestions, posts, credits] = await Promise.all([
    prisma.suggestion.findMany({
      where: { characterId, status: "accepted", clerkUserId: { not: null } },
      select: { clerkUserId: true },
    }),
    prisma.creatorPost.findMany({
      where: {
        creatorRole: { status: "approved" },
        characters: { some: { characterId } },
      },
      select: {
        creatorRole: {
          select: { userProfile: { select: { clerkUserId: true } } },
        },
      },
    }),
    prisma.pointEntry.findMany({
      where: { characterId },
      select: { userProfile: { select: { clerkUserId: true } } },
    }),
  ]);

  const clerkIds = [
    ...new Set([
      ...credits.map((c) => c.userProfile.clerkUserId),
      ...suggestions.map((s) => s.clerkUserId!),
      ...posts.map((p) => p.creatorRole.userProfile.clerkUserId),
    ]),
  ];
  if (!clerkIds.length) return [];

  const profiles = await prisma.userProfile.findMany({
    where: {
      clerkUserId: { in: clerkIds },
      profilePublic: true,
      pseudo: { not: null },
    },
    select: { clerkUserId: true, pseudo: true },
    orderBy: { pseudo: "asc" },
  });
  if (!profiles.length) return [];

  const avatars = new Map<string, string>();
  try {
    const { data } = await clerk.users.getUserList({
      userId: profiles.map((p) => p.clerkUserId).slice(0, 100),
      limit: 100,
    });
    for (const u of data) avatars.set(u.id, u.imageUrl);
  } catch {
    // Clerk indisponible : contributeurs sans avatar.
  }

  return profiles.map((p) => ({
    pseudo: p.pseudo!,
    avatarUrl: avatars.get(p.clerkUserId) ?? null,
  }));
}

export const getCharacterContributors = unstable_cache(
  loadCharacterContributors,
  ["character-contributors"],
  { revalidate: 300, tags: ["wiki-data", "profiles"] },
);

// ─── Classement des contributeurs (/classement) ──────────────────────────────

export type LeaderboardEntry = {
  rank: number;
  pseudo: string;
  avatarUrl: string | null;
  points: number;
  accepted: number;
  badges: string[];
  /** Versions où le membre a contribué (sans les créations), de la plus ancienne à la plus récente. */
  versions: VersionBadge[];
};

/** Ids Clerk des membres de l'organisation admin : exclus du classement. */
async function adminClerkIds(): Promise<Set<string>> {
  const organizationId = process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID;
  if (!organizationId) return new Set();
  const ids = new Set<string>();
  try {
    for (let offset = 0; ; offset += 100) {
      const { data } = await clerk.organizations.getOrganizationMembershipList({
        organizationId,
        limit: 100,
        offset,
      });
      for (const m of data) {
        const id = m.publicUserData?.userId;
        if (id) ids.add(id);
      }
      if (data.length < 100) break;
    }
  } catch {
    // Clerk indisponible : on ne peut pas filtrer, mieux vaut ne rien afficher.
    throw new Error("Impossible de lister les admins");
  }
  return ids;
}

/**
 * Membres triés par points (10 par proposition acceptée). Exclut les admins,
 * les profils masqués ou sans pseudo, et ceux qui n'ont aucun point.
 * Les membres qui masquent leurs stats ne sont pas classés non plus.
 */
async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  const [admins, profiles] = await Promise.all([
    adminClerkIds(),
    prisma.userProfile.findMany({
      where: {
        profilePublic: true,
        showStats: true,
        pseudo: { not: null },
        totalPoints: { gt: 0 },
      },
      orderBy: [
        { totalPoints: "desc" },
        { acceptedCount: "desc" },
        { createdAt: "asc" },
      ],
      select: {
        clerkUserId: true,
        pseudo: true,
        totalPoints: true,
        acceptedCount: true,
        badges: true,
      },
    }),
  ]);

  const ranked = profiles.filter((p) => !admins.has(p.clerkUserId)).slice(0, 100);

  const versionBadges = await getVersionBadges(ranked.map((p) => p.clerkUserId));

  const avatars = new Map<string, string>();
  try {
    const { data } = await clerk.users.getUserList({
      userId: ranked.map((p) => p.clerkUserId),
      limit: 100,
    });
    for (const u of data) avatars.set(u.id, u.imageUrl);
  } catch {
    // Clerk indisponible : classement sans avatars.
  }

  return ranked.map((p, i) => ({
    rank: i + 1,
    pseudo: p.pseudo!,
    avatarUrl: avatars.get(p.clerkUserId) ?? null,
    points: p.totalPoints,
    accepted: p.acceptedCount,
    badges: p.badges,
    versions: versionBadges.get(p.clerkUserId)?.contributor ?? [],
  }));
}

export const getLeaderboard = unstable_cache(
  loadLeaderboard,
  ["leaderboard"],
  { revalidate: 300, tags: ["wiki-data", "profiles"] },
);
