"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { failure, refreshAll, type ActionResult } from "./shared";

export type PointsInput = {
  userProfileId: string;
  points: number;
  reason: string;
  characterId: string | null;
};

/**
 * Attribue des points à un membre (contribution envoyée sur Discord, etc.).
 * Avec un personnage, le membre apparaît dans les « Contributeurs » de sa fiche ;
 * 0 point + personnage = simple crédit.
 */
export async function addPoints(input: PointsInput): Promise<ActionResult> {
  try {
    const adminId = await requireAdmin();
    const reason = input.reason.trim();
    const points = Math.trunc(Number(input.points));
    if (!reason) return { ok: false, error: "Le motif est requis." };
    if (!Number.isFinite(points) || points < 0 || points > 1000)
      return { ok: false, error: "Points : un nombre entre 0 et 1000." };
    if (points === 0 && !input.characterId)
      return { ok: false, error: "Indique des points ou un personnage." };

    const profile = await prisma.userProfile.findUnique({
      where: { id: input.userProfileId },
      select: { id: true },
    });
    if (!profile) return { ok: false, error: "Membre introuvable." };

    let characterName: string | null = null;
    if (input.characterId) {
      const c = await prisma.character.findUnique({
        where: { id: input.characterId },
        select: { nom: true },
      });
      if (!c) return { ok: false, error: "Personnage introuvable." };
      characterName = c.nom;
    }

    const message = [
      points > 0 ? `+${points} point${points > 1 ? "s" : ""}` : "Contribution créditée",
      characterName ? `sur ${characterName}` : null,
      `: ${reason}`,
    ]
      .filter(Boolean)
      .join(" ");

    await prisma.$transaction([
      prisma.pointEntry.create({
        data: {
          userProfileId: profile.id,
          points,
          reason,
          grantedBy: adminId,
          characterId: input.characterId,
        },
      }),
      ...(points > 0
        ? [
            prisma.userProfile.update({
              where: { id: profile.id },
              data: { totalPoints: { increment: points } },
            }),
          ]
        : []),
      prisma.notification.create({
        data: { userProfileId: profile.id, type: "points_granted", message },
      }),
    ]);

    await refreshAll();
    return { ok: true };
  } catch (err) {
    return failure(err);
  }
}
