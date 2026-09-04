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
    create: { clerkUserId: userId, onboardingComplete: true },
    update: {},
  });

  const role = await prisma.creatorRole.upsert({
    where: { userProfileId_type: { userProfileId: profile.id, type: data.type } },
    create: {
      userProfileId: profile.id,
      type: data.type,
      status: "pending",
      displayOnWiki: true,
    },
    update: {},
  });

  await prisma.creatorPost.create({
    data: {
      creatorRoleId: role.id,
      type: data.type,
      status: "pending",
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl?.trim() || null,
      platform: data.platform,
      caption: data.caption?.trim() || null,
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
