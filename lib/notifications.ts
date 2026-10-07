import { BADGES_CONFIG } from "@/components/user/badges";
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

export async function notifyBadgesEarned(
  clerkUserId: string,
  badgeKeys: string[],
) {
  for (const key of badgeKeys) {
    const cfg = BADGES_CONFIG.find((b) => b.key === key);
    if (!cfg) continue;
    await notifyUser(
      clerkUserId,
      "badge_earned",
      `Nouveau badge débloqué : ${cfg.icon} ${cfg.label} !`,
    );
  }
}
