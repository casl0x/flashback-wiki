// app/onboarding/action.ts
"use server";

import { prisma } from "@/lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { CreatorType, SocialPlatform } from "@prisma/client";

type SocialLinkInput = {
  platform: SocialPlatform;
  url: string;
};

type CreatorRoleInput = {
  type: CreatorType;
  displayOnWiki: boolean;
  socialLinks: SocialLinkInput[];
};

export async function completeOnboarding(data: {
  pseudo: string;
  roles: CreatorRoleInput[];
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
      creatorRoles: {
        create: data.roles.map((r) => ({
          type: r.type,
          displayOnWiki: r.displayOnWiki,
          status: "pending",
          socialLinks: {
            createMany: {
              data: r.socialLinks.filter((l) => l.url.trim() !== ""),
            },
          },
        })),
      },
    },
    update: {
      pseudo: data.pseudo,
      onboardingComplete: true,
    },
  });

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { onboardingComplete: true },
  });
}

export async function updateCreatorProfile(data: {
  roles: CreatorRoleInput[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId, onboardingComplete: true },
    update: {},
  });

  const newTypes = data.roles.map((r) => r.type);

  const existingRoles = await prisma.creatorRole.findMany({
    where: { userProfileId: profile.id },
    select: { id: true, type: true },
  });
  const existingTypes = existingRoles.map((r) => r.type);

  // Supprimer les rôles décochés (cascade supprime leurs liens)
  await prisma.creatorRole.deleteMany({
    where: { userProfileId: profile.id, type: { notIn: newTypes } },
  });

  for (const role of data.roles) {
    const existing = existingRoles.find((r) => r.type === role.type);

    if (existing) {
      // Rôle existant → update displayOnWiki + remplace les liens
      await prisma.creatorRole.update({
        where: { id: existing.id },
        data: {
          displayOnWiki: role.displayOnWiki,
          socialLinks: {
            deleteMany: {},
            createMany: {
              data: role.socialLinks.filter((l) => l.url.trim() !== ""),
            },
          },
        },
      });
    } else {
      // Nouveau rôle → pending
      await prisma.creatorRole.create({
        data: {
          userProfileId: profile.id,
          type: role.type,
          displayOnWiki: role.displayOnWiki,
          status: "pending",
          socialLinks: {
            createMany: {
              data: role.socialLinks.filter((l) => l.url.trim() !== ""),
            },
          },
        },
      });
    }
  }
}
