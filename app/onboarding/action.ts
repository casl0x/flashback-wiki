"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import type { SocialPlatform } from "@prisma/client";

export async function updateCreatorProfile(data: {
  roles: { type: "ARTISTE" | "EDITEUR"; displayOnWiki: boolean }[];
  socialLinks: { platform: SocialPlatform; url: string }[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });
  if (!profile) throw new Error("Profil introuvable");

  await prisma.$transaction([
    prisma.creatorRole.deleteMany({ where: { userProfileId: profile.id } }),
    prisma.creatorRole.createMany({
      data: data.roles.map((r) => ({ ...r, userProfileId: profile.id })),
    }),
    prisma.socialLink.deleteMany({ where: { userProfileId: profile.id } }),
    prisma.socialLink.createMany({
      data: data.socialLinks
        .filter((l) => l.url.trim() !== "")
        .map((l) => ({ ...l, userProfileId: profile.id })),
    }),
  ]);

  return { success: true };
}
