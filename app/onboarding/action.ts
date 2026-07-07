// app/onboarding/action.ts
"use server";

import { prisma } from "@/lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { CreatorType, SocialPlatform } from "@prisma/client";

type CreatorRoleInput = {
  type: CreatorType;
  displayOnWiki: boolean;
};

type SocialLinkInput = {
  platform: SocialPlatform;
  url: string;
};

export async function completeOnboarding(data: {
  pseudo: string;
  roles: CreatorRoleInput[];
  socialLinks: SocialLinkInput[];
}) {
  const { userId } = await auth();
  console.log("userId dans completeOnboarding:", userId);
  if (!userId) throw new Error("Non authentifié");

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: {
      clerkUserId: userId,
      pseudo: data.pseudo,
      onboardingComplete: true,
      creatorRoles: { create: data.roles },
      socialLinks: { create: data.socialLinks },
    },
    update: {
      pseudo: data.pseudo,
      onboardingComplete: true,
      creatorRoles: { create: data.roles },
      socialLinks: { create: data.socialLinks },
    },
  });

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { onboardingComplete: true },
  });
}

export async function updateCreatorProfile(data: {
  roles: CreatorRoleInput[];
  socialLinks: SocialLinkInput[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId, onboardingComplete: true },
    update: {},
  });

  const newTypes = data.roles.map((r) => r.type);

  // Récupère les rôles existants AVANT la transaction
  const existingRoles = await prisma.creatorRole.findMany({
    where: { userProfileId: profile.id },
    select: { type: true },
  });
  const existingTypes = existingRoles.map((r) => r.type);

  const toCreate = data.roles.filter((r) => !existingTypes.includes(r.type));
  const toUpdate = data.roles.filter((r) => existingTypes.includes(r.type));

  // Transaction légère avec seulement les writes
  await prisma.$transaction([
    // Supprimer rôles décochés
    prisma.creatorRole.deleteMany({
      where: { userProfileId: profile.id, type: { notIn: newTypes } },
    }),
    // Update displayOnWiki des rôles existants
    ...toUpdate.map((r) =>
      prisma.creatorRole.updateMany({
        where: { userProfileId: profile.id, type: r.type },
        data: { displayOnWiki: r.displayOnWiki },
      }),
    ),
    // Créer les nouveaux rôles
    ...toCreate.map((r) =>
      prisma.creatorRole.create({
        data: {
          userProfileId: profile.id,
          type: r.type,
          displayOnWiki: r.displayOnWiki,
          status: "pending",
        },
      }),
    ),
    // Liens
    prisma.socialLink.deleteMany({ where: { userProfileId: profile.id } }),
    prisma.socialLink.createMany({
      data: data.socialLinks
        .filter((l) => l.url.trim() !== "")
        .map((l) => ({ ...l, userProfileId: profile.id })),
    }),
  ]);
}
