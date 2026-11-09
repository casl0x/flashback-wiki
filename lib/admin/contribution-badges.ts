import "server-only";

import { computeBadges } from "@/lib/badge-thresholds";
import { prisma } from "@/lib/db";
import { notifyBadgesEarned } from "@/lib/notifications";

/**
 * Recalcule les badges de contribution d'un membre d'après son total de points. Ne retire jamais un badge et
 * peut être relancé sans danger (aucun double comptage).
 * Renvoie les badges nouvellement gagnés.
 */
export async function syncContributionBadges(userProfileId: string): Promise<string[]> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userProfileId },
    select: {
      clerkUserId: true,
      totalPoints: true,
      badges: true,
    },
  });
  if (!profile) return [];
  const computed = computeBadges(profile.totalPoints);
  const earned = computed.filter((b) => !profile.badges.includes(b));
  if (!earned.length) return [];
  await prisma.userProfile.update({
    where: { id: userProfileId },
    data: { badges: [...new Set([...profile.badges, ...computed])] },
  });
  await notifyBadgesEarned(profile.clerkUserId, earned);
  return earned;
}
