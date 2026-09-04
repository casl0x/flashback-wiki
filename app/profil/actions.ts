"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { CreatorType, SocialPlatform } from "@prisma/client";

export async function createCreatorPost(data: {
  type: CreatorType;
  imageUrl?: string;
  linkUrl?: string;
  platform?: SocialPlatform;
  caption?: string;
  characterId?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  if (data.type === "ARTISTE" && !data.imageUrl) {
    throw new Error("Une image est requise pour un fan art");
  }
  if (data.type === "EDITEUR" && !data.linkUrl?.trim()) {
    throw new Error("Un lien est requis pour un edit");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });

  const role = profile
    ? await prisma.creatorRole.findUnique({
        where: { userProfileId_type: { userProfileId: profile.id, type: data.type } },
      })
    : null;

  if (!role || role.status !== "approved") {
    throw new Error(
      "Ton profil créateur doit être validé par un admin avant de pouvoir publier.",
    );
  }

  await prisma.creatorPost.create({
    data: {
      creatorRoleId: role.id,
      type: data.type,
      // Pas de validation par publication : seul le profil créateur est validé par un admin.
      status: "approved",
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl?.trim() || null,
      platform: data.platform,
      caption: data.caption?.trim() || null,
      characterId: data.characterId || null,
    },
  });
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
}
