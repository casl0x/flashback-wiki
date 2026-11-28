"use server";

import { syncDiscordRoles } from "@/lib/bot-sync";
import { cleanupReplacedImage } from "@/lib/cloudinary-server";
import { invalidateProfilesCache, invalidateWikiCache } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { detectSoundPlatform } from "@/lib/media-embed";
import { notifyFavoriteUpdated } from "@/lib/favorites";
import { getKickAvatar } from "@/lib/kick";
import { notifyBadgesEarned } from "@/lib/notifications";
import { HEX_COLOR_RE } from "@/lib/profile-banner";
import { getTwitchAvatar } from "@/lib/twitch";
import { detectStreamPlatform, extractStreamUsername } from "@/lib/utils";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { CreatorType, Prisma, SocialPlatform } from "@prisma/client";

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
  if (data.type === "BESTOF" && !data.linkUrl?.trim()) {
    throw new Error("Le lien de la chaîne est requis pour un best-of");
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
      platform: data.type === "BESTOF" ? "YOUTUBE" : data.platform,
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

  // Une demande (refusée ou ancienne) peut déjà exister pour ce couple compte/joueur :
  // la contrainte d'unicité interdit d'en créer une seconde, on la repasse en attente.
  await prisma.playerLinkRequest.upsert({
    where: { userProfileId_playerId: { userProfileId: profile.id, playerId } },
    create: {
      userProfileId: profile.id,
      playerId,
      message: message?.trim() || null,
    },
    update: {
      status: "pending",
      message: message?.trim() || null,
      reviewedAt: null,
      createdAt: new Date(),
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

  const newImage = data.imageUrl?.trim() || null;
  const previous = await prisma.player.findUnique({ where: { id: playerId }, select: { imageUrl: true } });
  await prisma.player.update({
    where: { id: playerId },
    data: { pseudo, chaines, reseaux, imageUrl: newImage },
  });
  await cleanupReplacedImage(previous?.imageUrl, newImage);
  await notifyFavoriteUpdated("PLAYER", playerId, pseudo);

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

/** Avatar Kick d'un lien de chaîne, pour le joueur lié qui édite sa propre fiche. */
export async function fetchMyKickAvatar(channelUrl: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");
  await requireLinkedPlayerId(userId);

  if (detectStreamPlatform(channelUrl) !== "kick") {
    throw new Error("Ce n'est pas un lien Kick.");
  }
  const slug = extractStreamUsername(channelUrl);
  if (!slug) throw new Error("Pseudo Kick introuvable dans le lien.");
  const avatarUrl = await getKickAvatar(slug);
  if (!avatarUrl) throw new Error("Avatar introuvable sur Kick.");
  return avatarUrl;
}

/**
 * Présentation d'un perso du joueur lié : description, image, rediffusions
 * et sons, éditables en direct (sans modération). Le reste de la fiche
 * (groupes/parcours, versions, relations) passe toujours par une
 * proposition — ce sont des infos canoniques, et les relations touchent
 * aussi les persos d'autres joueurs.
 */
export async function updateOwnCharacterPresentation(
  characterId: string,
  data: {
    description: string;
    imageUrl: string | null;
    lienReddifs: { url: string; titre: string | null }[];
    sounds: { titre: string; artiste: string | null; url: string }[];
  },
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");
  const playerId = await requireLinkedPlayerId(userId);

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { playerId: true, imageUrl: true, nom: true },
  });
  if (!character || character.playerId !== playerId) {
    throw new Error("Ce personnage ne t'appartient pas.");
  }

  const lienReddifs = data.lienReddifs
    .map((r) => ({ url: r.url.trim(), titre: r.titre?.trim() || null }))
    .filter((r) => r.url);
  const sounds = data.sounds
    .map((s) => ({
      titre: s.titre.trim(),
      artiste: s.artiste?.trim() || null,
      url: s.url.trim(),
    }))
    .filter((s) => s.titre && s.url);

  await prisma.$transaction(async (tx) => {
    await tx.character.update({
      where: { id: characterId },
      data: {
        description: data.description.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        lienReddifs: lienReddifs as Prisma.InputJsonValue,
      },
    });
    await tx.sound.deleteMany({ where: { characterId } });
    if (sounds.length) {
      await tx.sound.createMany({
        data: sounds.map((s, i) => ({
          characterId,
          titre: s.titre,
          artiste: s.artiste,
          url: s.url,
          platform: detectSoundPlatform(s.url),
          ordre: i,
        })),
      });
    }
  });

  await cleanupReplacedImage(character.imageUrl, data.imageUrl?.trim() || null);
  await notifyFavoriteUpdated("CHARACTER", characterId, character.nom);
  await invalidateWikiCache();
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
  await cleanupReplacedImage(post.imageUrl, null);
  await invalidateProfilesCache();
}

/** Bio et réglages de visibilité du profil public. */
export async function updatePublicProfile(data: {
  bio: string;
  profilePublic: boolean;
  showStats: boolean;
  showFavorites?: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const fields = {
    bio: data.bio.trim().slice(0, 500) || null,
    profilePublic: data.profilePublic,
    showStats: data.showStats,
    ...(data.showFavorites !== undefined ? { showFavorites: data.showFavorites } : {}),
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

/**
 * Appelée au retour de la liaison d'un compte Discord : envoie l'état du membre au bot
 * (attribution des rôles, ajout au serveur Discord grâce au jeton fraîchement obtenu).
 */
export async function syncMyDiscordRoles() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");
  await syncDiscordRoles(userId, { joinGuild: true });
}

/**
 * Supprime définitivement le compte de l'utilisateur connecté et tout ce qui
 * lui est lié : profil (et ses cascades : notifications, réseaux, rôles et
 * publications créateur, points, demandes de lien), propositions, votes,
 * options de sondage proposées, likes, signalements, images Cloudinary,
 * après avoir supprimé l'utilisateur Clerk (premier, pour pouvoir réessayer en cas d'échec). La fiche joueur / les personnages du wiki restent.
 */
export async function deleteMyAccount() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    include: {
      creatorRoles: { include: { posts: { select: { id: true, imageUrl: true } } } },
    },
  });
  const posts = profile?.creatorRoles.flatMap((r) => r.posts) ?? [];
  const suggestions = await prisma.suggestion.findMany({
    where: { clerkUserId: userId },
    select: { imageUrl: true },
  });
  const targetIds = [
    userId,
    ...posts.map((p) => p.id),
    ...(profile ? [profile.id] : []),
    ...(profile?.pseudo ? [profile.pseudo] : []),
  ];

  // Clerk d'abord : s'il échoue, rien n'est encore supprimé en base et l'utilisateur peut réessayer.
  const client = await clerkClient();
  await client.users.deleteUser(userId);

  await prisma.$transaction([
    prisma.suggestion.deleteMany({ where: { clerkUserId: userId } }),
    prisma.pollVote.deleteMany({ where: { userId } }),
    prisma.pollOption.deleteMany({ where: { proposedBy: userId } }),
    prisma.creatorPostLike.deleteMany({ where: { clerkUserId: userId } }),
    prisma.report.deleteMany({
      where: { OR: [{ reporterClerkUserId: userId }, { targetId: { in: targetIds } }] },
    }),
    prisma.userProfile.deleteMany({ where: { clerkUserId: userId } }),
  ]);

  // Après la base : les images ne sont plus référencées, on les supprime de Cloudinary.
  for (const img of [...posts.map((p) => p.imageUrl), ...suggestions.map((s) => s.imageUrl)]) {
    await cleanupReplacedImage(img, null);
  }

  await invalidateProfilesCache();
  await invalidateWikiCache();
}

/** Ajoute ou retire un joueur / personnage des favoris du compte. Renvoie le nouvel état. */
export async function toggleFavorite(
  kind: "PLAYER" | "CHARACTER",
  targetId: string,
): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) throw new Error("Connecte-toi pour ajouter des favoris.");
  if (kind !== "PLAYER" && kind !== "CHARACTER") throw new Error("Type invalide.");

  const exists =
    kind === "PLAYER"
      ? await prisma.player.findUnique({ where: { id: targetId }, select: { id: true } })
      : await prisma.character.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!exists) throw new Error("Fiche introuvable.");

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId },
    update: {},
    select: { id: true },
  });

  const key = { userProfileId_kind_targetId: { userProfileId: profile.id, kind, targetId } };
  const current = await prisma.favorite.findUnique({ where: key, select: { id: true } });
  if (current) {
    await prisma.favorite.delete({ where: key });
  } else {
    await prisma.favorite.create({ data: { userProfileId: profile.id, kind, targetId } });
  }
  await invalidateProfilesCache();
  return !current;
}

/**
 * L'auteur d'une proposition en attente répond à la question d'un admin.
 * Une réponse à la fois : il faut qu'un admin ait écrit en dernier.
 */
export async function replyToSuggestion(suggestionId: string, text: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");
  const reply = text.trim().slice(0, 1000);
  if (!reply) throw new Error("Écris ta réponse.");

  const suggestion = await prisma.suggestion.findUnique({
    where: { id: suggestionId },
    select: {
      clerkUserId: true,
      status: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { fromAdmin: true } },
    },
  });
  if (!suggestion || suggestion.clerkUserId !== userId) throw new Error("Proposition introuvable.");
  if (suggestion.status !== "pending") throw new Error("Cette proposition a déjà été traitée.");
  if (!suggestion.messages[0]?.fromAdmin) throw new Error("Aucune question en attente de réponse.");

  await prisma.suggestionMessage.create({
    data: { suggestionId, fromAdmin: false, text: reply },
  });
}
