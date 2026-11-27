import { prisma } from "@/lib/db";
import type { FavoriteKind } from "@prisma/client";

// Notifications liées aux favoris. Elles ne doivent jamais faire échouer l'action
// qui les déclenche (modification ou suppression d'une fiche) : tout est try/catch.

/**
 * Prévient les comptes qui ont cette fiche en favori qu'elle a été modifiée.
 * Une seule notification non lue à la fois par fiche (pas de spam si l'admin
 * enchaîne les modifications).
 */
export async function notifyFavoriteUpdated(
  kind: FavoriteKind,
  targetId: string,
  name: string,
): Promise<void> {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { kind, targetId },
      select: { userProfileId: true },
    });
    if (!favorites.length) return;

    const message = `Ton favori « ${name} » a été mis à jour.`;
    const ids = favorites.map((f) => f.userProfileId);
    const alreadyNotified = await prisma.notification.findMany({
      where: {
        userProfileId: { in: ids },
        type: "favorite_updated",
        message,
        read: false,
      },
      select: { userProfileId: true },
    });
    const skip = new Set(alreadyNotified.map((n) => n.userProfileId));

    const toNotify = ids.filter((id) => !skip.has(id));
    if (!toNotify.length) return;
    await prisma.notification.createMany({
      data: toNotify.map((userProfileId) => ({
        userProfileId,
        type: "favorite_updated",
        message,
      })),
    });
  } catch (e) {
    console.error("Favoris: notification de mise à jour impossible", e);
  }
}

/**
 * À appeler APRÈS la suppression d'un joueur ou d'un personnage : prévient les
 * comptes qui l'avaient en favori, puis retire ces favoris.
 */
export async function handleFavoriteTargetDeleted(
  kind: FavoriteKind,
  targetId: string,
  name: string,
): Promise<void> {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { kind, targetId },
      select: { userProfileId: true },
    });
    if (favorites.length) {
      const what = kind === "PLAYER" ? "Le joueur" : "Le personnage";
      await prisma.notification.createMany({
        data: favorites.map((f) => ({
          userProfileId: f.userProfileId,
          type: "favorite_deleted",
          message: `${what} « ${name} » a été supprimé du wiki, il a été retiré de tes favoris.`,
        })),
      });
    }
    await prisma.favorite.deleteMany({ where: { kind, targetId } });
  } catch (e) {
    console.error("Favoris: nettoyage après suppression impossible", e);
  }
}
