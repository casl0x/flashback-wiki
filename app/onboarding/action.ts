// app/onboarding/action.ts
"use server";

import { invalidateProfilesCache } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { isPseudoTaken } from "@/lib/public-profile";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { CreatorType } from "@prisma/client";

type CreatorRoleInput = {
  type: CreatorType;
  displayOnWiki: boolean;
};

export async function completeOnboarding(data: {
  pseudo: string;
  roles: CreatorRoleInput[];
}): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const pseudo = data.pseudo.trim();
  if (!pseudo) return { error: "Le pseudo est obligatoire." };
  // Le pseudo sert d'adresse au profil public : il doit être unique.
  if (await isPseudoTaken(pseudo, userId)) {
    return { error: "Ce pseudo est déjà pris, choisis-en un autre." };
  }

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: {
      clerkUserId: userId,
      pseudo,
      onboardingComplete: true,
      creatorRoles: {
        create: data.roles.map((r) => ({
          type: r.type,
          displayOnWiki: r.displayOnWiki,
          status: "approved",
        })),
      },
    },
    update: {
      pseudo,
      onboardingComplete: true,
    },
  });

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { onboardingComplete: true },
  });
  await invalidateProfilesCache();
  return {};
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

  // Supprimer les rôles décochés
  await prisma.creatorRole.deleteMany({
    where: { userProfileId: profile.id, type: { notIn: newTypes } },
  });

  for (const role of data.roles) {
    const existing = existingRoles.find((r) => r.type === role.type);

    if (existing) {
      await prisma.creatorRole.update({
        where: { id: existing.id },
        data: { displayOnWiki: role.displayOnWiki },
      });
    } else {
      await prisma.creatorRole.create({
        data: {
          userProfileId: profile.id,
          type: role.type,
          displayOnWiki: role.displayOnWiki,
          status: "approved",
        },
      });
    }
  }

  await invalidateProfilesCache();
}
