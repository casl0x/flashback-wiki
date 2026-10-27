import type { EtatVie, VersionTag } from "@/lib/character-page";
import { prisma } from "@/lib/db";
import { versionRank } from "@/lib/version-rank";
import { createClerkClient } from "@clerk/nextjs/server";
import { CreatorType, SocialPlatform } from "@prisma/client";
import { unstable_cache } from "next/cache";

// ─── Profils publics (/profil/[pseudo]) ──────────────────────────────────────
// Tout utilisateur ayant un pseudo a un profil public, sauf s'il l'a masqué.

export type PublicProfileData = {
  pseudo: string;
  avatarUrl: string | null;
  bio: string | null;
  badges: string[];
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

async function loadPublicProfile(pseudo: string): Promise<PublicProfileData | null> {
  const found = await findProfileByPseudo(pseudo);
  if (!found?.pseudo || !found.profilePublic) return null;

  const [profile, avatarUrl] = await Promise.all([
    prisma.userProfile.findUniqueOrThrow({
      where: { id: found.id },
      include: {
        player: { select: { id: true, pseudo: true } },
        creatorRoles: {
          where: { status: "approved" },
          include: {
            socialLinks: true,
            posts: {
              orderBy: { createdAt: "desc" },
              include: {
                characters: { include: { character: { select: { id: true, nom: true } } } },
              },
            },
          },
        },
      },
    }),
    avatarOf(found.clerkUserId),
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
    pseudo: profile.pseudo!,
    avatarUrl,
    bio: profile.bio,
    badges: profile.badges,
    stats: profile.showStats
      ? { accepted: profile.acceptedCount, points: profile.totalPoints, creations: posts.length }
      : null,
    creatorTypes: profile.creatorRoles.map((r) => r.type),
    socialLinks: profile.creatorRoles.flatMap((r) =>
      r.socialLinks.map((l) => ({ platform: l.platform, url: l.url })),
    ),
    player: profile.player,
    characters: characters.map((c) => ({
      id: c.id,
      nom: c.nom,
      imageUrl: c.imageUrl,
      etatVie: c.etatVie as EtatVie,
      version:
        [...c.versions].sort((a, b) => versionRank(a.id) - versionRank(b.id)).at(-1) ?? null,
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

export const getPublicProfile = unstable_cache(loadPublicProfile, ["public-profile"], {
  revalidate: 300,
  tags: ["profiles"],
});

// ─── Contributeurs d'une fiche personnage ────────────────────────────────────

export type Contributor = { pseudo: string; avatarUrl: string | null };

/**
 * Membres ayant une proposition acceptée sur ce perso ou une création qui le
 * mentionne. Les profils masqués ne sont pas listés.
 */
async function loadCharacterContributors(characterId: string): Promise<Contributor[]> {
  const [suggestions, posts] = await Promise.all([
    prisma.suggestion.findMany({
      where: { characterId, status: "accepted", clerkUserId: { not: null } },
      select: { clerkUserId: true },
    }),
    prisma.creatorPost.findMany({
      where: { creatorRole: { status: "approved" }, characters: { some: { characterId } } },
      select: { creatorRole: { select: { userProfile: { select: { clerkUserId: true } } } } },
    }),
  ]);

  const clerkIds = [
    ...new Set([
      ...suggestions.map((s) => s.clerkUserId!),
      ...posts.map((p) => p.creatorRole.userProfile.clerkUserId),
    ]),
  ];
  if (!clerkIds.length) return [];

  const profiles = await prisma.userProfile.findMany({
    where: { clerkUserId: { in: clerkIds }, profilePublic: true, pseudo: { not: null } },
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
