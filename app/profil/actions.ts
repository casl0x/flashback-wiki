"use server";

import { invalidateProfilesCache, invalidateWikiCache } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { notifyBadgesEarned } from "@/lib/notifications";
import { HEX_COLOR_RE } from "@/lib/profile-banner";
import { getTwitchAvatar } from "@/lib/twitch";
import { detectStreamPlatform, extractStreamUsername } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { CreatorType, SocialPlatform } from "@prisma/client";

export async function createCreatorPost(data: {
  type: CreatorType;
  imageUrl?: string;
  linkUrl?: string;
  platform?: SocialPlatform;
  caption?: string;
  characterIds?: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  if (data.type === "ARTISTE" && !data.imageUrl) {
    throw new Error("Une image est requise pour un fan art");
  }
  if (data.type === "EDITEUR" && !data.linkUrl?.trim()) {
    throw new Error("Un lien est requis pour un edit");
  }

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId },
    update: {},
  });

  // Aucune validation admin requise : le rôle est créé (ou réutilisé)
  // directement, seulement pour classer les publications par type.
  const role = await prisma.creatorRole.upsert({
    where: {
      userProfileId_type: { userProfileId: profile.id, type: data.type },
    },
    create: { userProfileId: profile.id, type: data.type, status: "approved" },
    update: {},
  });

  const characterIds = [...new Set(data.characterIds ?? [])];

  await prisma.creatorPost.create({
    data: {
      creatorRoleId: role.id,
      type: data.type,
      status: "approved",
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl?.trim() || null,
      platform: data.platform,
      caption: data.caption?.trim() || null,
      characters: characterIds.length
        ? {
            createMany: {
              data: characterIds.map((characterId) => ({ characterId })),
            },
          }
        : undefined,
    },
  });

  await invalidateProfilesCache();

  const posts = await prisma.creatorPost.findMany({
    where: { creatorRole: { userProfileId: profile.id }, status: "approved" },
    select: { type: true },
  });
  const computedBadges = computeCreatorBadges(posts.map((p) => p.type));
  if (computedBadges.length) {
    const current = await prisma.userProfile.findUnique({
      where: { id: profile.id },
      select: { badges: true },
    });
    const existing = current?.badges ?? [];
    const merged = [...new Set([...existing, ...computedBadges])];
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { badges: merged },
    });

    const earned = computedBadges.filter((b) => !existing.includes(b));
    if (earned.length) await notifyBadgesEarned(userId, earned);
  }
}

function computeCreatorBadges(types: CreatorType[]): string[] {
  const badges: string[] = [];

  if (types.length >= 1) badges.push("first-creation");
  if (types.length >= 5) badges.push("active-creator");
  if (types.length >= 15) badges.push("prolific-creator");
  if (types.includes("ARTISTE") && types.includes("EDITEUR")) {
    badges.push("versatile-creator");
  }

  return badges;
}

export async function requestPlayerLink(playerId: string, message?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId },
    update: {},
  });

  if (profile.playerId) {
    throw new Error("Ton compte est déjà lié à une fiche joueur.");
  }

  const pending = await prisma.playerLinkRequest.findFirst({
    where: { userProfileId: profile.id, status: "pending" },
  });
  if (pending) {
    throw new Error("Une demande de lien est déjà en attente.");
  }

  await prisma.playerLinkRequest.create({
    data: {
      userProfileId: profile.id,
      playerId,
      message: message?.trim() || null,
    },
  });
}

/** Vérifie que le compte est lié à un joueur et renvoie son id. */
async function requireLinkedPlayerId(userId: string): Promise<string> {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { playerId: true },
  });
  if (!profile?.playerId) throw new Error("Aucun joueur lié à ce compte.");
  return profile.playerId;
}

/** Fiche joueur du compte lié : le joueur édite directement la sienne, sans modération. */
export async function updateLinkedPlayerProfile(data: {
  pseudo: string;
  chaines: string[];
  reseaux: Record<string, string>;
  imageUrl: string | null;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");
  const playerId = await requireLinkedPlayerId(userId);

  const pseudo = data.pseudo.trim();
  if (!pseudo) throw new Error("Le pseudo est requis.");

  const reseaux = Object.fromEntries(
    Object.entries(data.reseaux)
      .map(([k, v]) => [k, v.trim()] as const)
      .filter(([, v]) => v),
  );
  const chaines = data.chaines.map((c) => c.trim()).filter(Boolean);

  await prisma.player.update({
    where: { id: playerId },
    data: { pseudo, chaines, reseaux, imageUrl: data.imageUrl?.trim() || null },
  });

  await invalidateWikiCache();
  await invalidateProfilesCache();
}

/** Avatar Twitch d'un lien de chaîne, pour le joueur lié qui édite sa propre fiche. */
export async function fetchMyTwitchAvatar(channelUrl: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");
  await requireLinkedPlayerId(userId);

  if (detectStreamPlatform(channelUrl) !== "twitch") {
    throw new Error("Ce n'est pas un lien Twitch.");
  }
  const login = extractStreamUsername(channelUrl);
  if (!login) throw new Error("Pseudo Twitch introuvable dans le lien.");
  const avatarUrl = await getTwitchAvatar(login);
  if (!avatarUrl) throw new Error("Avatar introuvable sur Twitch.");
  return avatarUrl;
}

export async function deleteCreatorPost(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const post = await prisma.creatorPost.findUnique({
    where: { id },
    include: { creatorRole: { include: { userProfile: true } } },
  });
  if (!post || post.creatorRole.userProfile.clerkUserId !== userId) {
    throw new Error("Publication introuvable");
  }

  await prisma.creatorPost.delete({ where: { id } });
  await invalidateProfilesCache();
}

/** Bio et réglages de visibilité du profil public. */
export async function updatePublicProfile(data: {
  bio: string;
  profilePublic: boolean;
  showStats: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const fields = {
    bio: data.bio.trim().slice(0, 500) || null,
    profilePublic: data.profilePublic,
    showStats: data.showStats,
  };
  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId, ...fields },
    update: fields,
  });
  await invalidateProfilesCache();
}

/** Réseaux sociaux du profil (un seul jeu de liens, partagé par toutes les créations). */
export async function updateSocialLinks(
  links: { platform: SocialPlatform; url: string }[],
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId },
    update: {},
  });

  const cleaned = links
    .map((l) => ({ platform: l.platform, url: l.url.trim() }))
    .filter((l) => l.url !== "");

  await prisma.$transaction([
    prisma.socialLink.deleteMany({ where: { userProfileId: profile.id } }),
    prisma.socialLink.createMany({
      data: cleaned.map((l) => ({ ...l, userProfileId: profile.id })),
    }),
  ]);
  await invalidateProfilesCache();
}

/** Signale une publication ou un profil abusif ; part directement dans la file admin. */
export async function createReport(data: {
  targetType: "POST" | "PROFILE";
  targetId: string;
  reason?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  await prisma.report.create({
    data: {
      targetType: data.targetType,
      targetId: data.targetId,
      reporterClerkUserId: userId,
      reason: data.reason?.trim() || null,
    },
  });
}

/** Trace l'acceptation des règles de publication créateur (une fois par compte). */
export async function acceptCreatorRules() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId, creatorRulesAcceptedAt: new Date() },
    update: { creatorRulesAcceptedAt: new Date() },
  });
}

/** Like / retire le like sur une création. Retourne le nouvel état. */
export async function toggleCreatorPostLike(
  postId: string,
): Promise<{ liked: boolean }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const key = {
    creatorPostId_clerkUserId: { creatorPostId: postId, clerkUserId: userId },
  };
  const existing = await prisma.creatorPostLike.findUnique({ where: key });

  if (existing) {
    await prisma.creatorPostLike.delete({ where: key });
    return { liked: false };
  }
  await prisma.creatorPostLike.create({
    data: { creatorPostId: postId, clerkUserId: userId },
  });
  return { liked: true };
}

/** Couleur de la bannière du profil ; null pour revenir au dégradé par défaut. */
export async function updateBannerColor(color: string | null) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");
  if (color !== null && !HEX_COLOR_RE.test(color)) {
    throw new Error("Couleur invalide.");
  }

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId, bannerColor: color },
    update: { bannerColor: color },
  });
  await invalidateProfilesCache();
}
