import "server-only";

import { computeBadges } from "@/lib/admin/suggestions";
import { prisma } from "@/lib/db";
import { notifyBadgesEarned } from "@/lib/notifications";

/**
 * Recalcule les badges de contribution d'un membre : propositions acceptées
 * + entrées de points attribuées par un admin. Ne retire jamais un badge et
 * peut être relancé sans danger (aucun double comptage).
 * Renvoie les badges nouvellement gagnés.
 */
export async function syncContributionBadges(userProfileId: string): Promise<string[]> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userProfileId },
    select: {
      clerkUserId: true,
      acceptedCount: true,
      badges: true,
      _count: { select: { pointEntries: true } },
    },
  });
  if (!profile) return [];
  const computed = computeBadges(profile.acceptedCount + profile._count.pointEntries);
  const earned = computed.filter((b) => !profile.badges.includes(b));
  if (!earned.length) return [];
  await prisma.userProfile.update({
    where: { id: userProfileId },
    data: { badges: [...new Set([...profile.badges, ...computed])] },
  });
  await notifyBadgesEarned(profile.clerkUserId, earned);
  return earned;
}
