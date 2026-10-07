import { prisma } from "@/lib/db";

export async function notifyUser(
  clerkUserId: string,
  type: string,
  message: string,
) {
  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId },
    create: { clerkUserId },
    update: {},
  });

  await prisma.notification.create({
    data: { userProfileId: profile.id, type, message },
  });
}
