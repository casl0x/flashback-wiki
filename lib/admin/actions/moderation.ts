"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { applyAcceptedSuggestion } from "@/lib/admin/suggestions";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { clean, failure, refreshAll, type ActionResult } from "./shared";

const label = (nom: string | null | undefined) =>
  nom ? ` pour « ${nom} »` : "";

export async function acceptSuggestion(
  id: string,
  message?: string,
): Promise<ActionResult<{ characterId: string | null }>> {
  try {
    await requireAdmin();
    const s = await prisma.suggestion.update({
      where: { id, status: "pending" },
      data: {
        status: "accepted",
        reviewedAt: new Date(),
        moderatorMessage: clean(message),
      },
      include: { character: { select: { nom: true } } },
    });
    const characterId = await applyAcceptedSuggestion(s);
    if (s.clerkUserId) {
      await notifyUser(
        s.clerkUserId,
        "suggestion_accepted",
        `Ta proposition${label(s.character?.nom ?? s.nom)} a été acceptée !${clean(message) ? ` ${clean(message)}` : ""}`,
      );
    }
    await refreshAll();
    return { ok: true, data: { characterId } };
  } catch (e) {
    return failure(e);
  }
}

export async function rejectSuggestion(
  id: string,
  reason: string,
  message: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const s = await prisma.suggestion.update({
      where: { id, status: "pending" },
      data: {
        status: "rejected",
        reviewedAt: new Date(),
        rejectReason: clean(reason),
        moderatorMessage: clean(message),
      },
      include: { character: { select: { nom: true } } },
    });
    if (s.clerkUserId) {
      await notifyUser(
        s.clerkUserId,
        "suggestion_rejected",
        `Ta proposition${label(s.character?.nom ?? s.nom)} a été refusée${clean(reason) ? ` (${clean(reason)})` : ""}.${clean(message) ? ` ${clean(message)}` : ""}`,
      );
    }
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/** Envoie une question à l'auteur sans changer le statut de la proposition. */
export async function askSuggestionDetails(
  id: string,
  message: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const text = clean(message);
    if (!text)
      return {
        ok: false,
        error: "Écris ta question dans le message à l’auteur.",
      };
    const s = await prisma.suggestion.findUniqueOrThrow({
      where: { id },
      include: { character: { select: { nom: true } } },
    });
    if (!s.clerkUserId)
      return { ok: false, error: "Cette proposition n’a pas d’auteur connu." };
    await notifyUser(
      s.clerkUserId,
      "suggestion_question",
      `Question sur ta proposition${label(s.character?.nom ?? s.nom)} : ${text}`,
    );
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function reviewCreation(
  id: string,
  decision: "approved" | "rejected",
  message?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const post = await prisma.creatorPost.findUniqueOrThrow({
      where: { id },
      include: {
        creatorRole: {
          include: { userProfile: { select: { clerkUserId: true } } },
        },
      },
    });
    if (decision === "approved") {
      await prisma.creatorPost.update({
        where: { id },
        data: { status: "approved" },
      });
    } else {
      // Une création refusée est retirée du wiki.
      await prisma.creatorPost.delete({ where: { id } });
      await notifyUser(
        post.creatorRole.userProfile.clerkUserId,
        "creator_post_rejected",
        `Ta publication a été retirée.${clean(message) ? ` ${clean(message)}` : ""}`,
      );
    }
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function reviewReport(
  id: string,
  decision: "remove" | "ignore",
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const report = await prisma.report.findUniqueOrThrow({ where: { id } });
    if (decision === "remove") {
      if (report.targetType === "POST") {
        await prisma.creatorPost
          .delete({ where: { id: report.targetId } })
          .catch(() => null);
      } else {
        await prisma.userProfile
          .update({
            where: { id: report.targetId },
            data: { profilePublic: false },
          })
          .catch(() => null);
      }
    }
    await prisma.report.update({ where: { id }, data: { status: "resolved" } });
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function reviewLinkRequest(
  id: string,
  decision: "accepted" | "rejected",
  message?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const req = await prisma.playerLinkRequest.findUniqueOrThrow({
      where: { id },
      include: { userProfile: true, player: { select: { pseudo: true } } },
    });

    if (decision === "accepted") {
      await prisma.$transaction([
        // Une fiche joueur ne peut être liée qu'à un seul compte.
        prisma.userProfile.updateMany({
          where: { playerId: req.playerId },
          data: { playerId: null },
        }),
        prisma.userProfile.update({
          where: { id: req.userProfileId },
          data: { playerId: req.playerId },
        }),
        prisma.playerLinkRequest.update({
          where: { id },
          data: { status: "accepted", reviewedAt: new Date() },
        }),
        prisma.playerLinkRequest.updateMany({
          where: { playerId: req.playerId, status: "pending", NOT: { id } },
          data: { status: "rejected", reviewedAt: new Date() },
        }),
      ]);
    } else {
      await prisma.playerLinkRequest.update({
        where: { id },
        data: { status: "rejected", reviewedAt: new Date() },
      });
    }

    await notifyUser(
      req.userProfile.clerkUserId,
      decision === "accepted" ? "player_link_accepted" : "player_link_rejected",
      decision === "accepted"
        ? `Ton compte est maintenant lié à la fiche joueur « ${req.player.pseudo} ».`
        : `Ta demande de lien avec « ${req.player.pseudo} » a été refusée.${clean(message) ? ` ${clean(message)}` : ""}`,
    );
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/** Ajoute une entrée « mise à jour du site » au journal public. */
export async function addSiteUpdate(
  label: string,
  detail: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const l = clean(label);
    if (!l) return { ok: false, error: "Le titre est requis." };
    await prisma.changelogEntry.create({
      data: { type: "site", label: l, detail: clean(detail) },
    });
    await refreshAll();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
