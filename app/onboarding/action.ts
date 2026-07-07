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
    include: { creatorRoles: true },
  });

  await prisma.$transaction(async (tx) => {
    // Supprimer les rôles qui ne sont plus sélectionnés
    const newTypes = data.roles.map((r) => r.type);
    await tx.creatorRole.deleteMany({
      where: {
        userProfileId: profile.id,
        type: { notIn: newTypes },
      },
    });

    const existingRoles = await tx.creatorRole.findMany({
      where: { userProfileId: profile.id },
    });
    const existingTypes = existingRoles.map((r) => r.type);

    // Upsert chaque rôle — préserve le status existant
    for (const role of data.roles) {
      if (existingTypes.includes(role.type)) {
        // Rôle existant → update displayOnWiki uniquement, status intact
        await tx.creatorRole.updateMany({
          where: { userProfileId: profile.id, type: role.type },
          data: { displayOnWiki: role.displayOnWiki },
        });
      } else {
        // Nouveau rôle → create avec pending
        await tx.creatorRole.create({
          data: {
            userProfileId: profile.id,
            type: role.type,
            displayOnWiki: role.displayOnWiki,
            status: "pending",
          },
        });
      }
    }

    // Liens — pas de statut, delete+create reste ok
    await tx.socialLink.deleteMany({ where: { userProfileId: profile.id } });
    await tx.socialLink.createMany({
      data: data.socialLinks
        .filter((l) => l.url.trim() !== "")
        .map((l) => ({ ...l, userProfileId: profile.id })),
    });
  });
}
