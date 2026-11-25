"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { syncDiscordRoles } from "@/lib/bot-sync";
import { prisma } from "@/lib/db";
import { failure, type ActionResult } from "./shared";

const BATCH_SIZE = 10;

/**
 * Envoie au bot l'état (rôle + badges) d'un lot de membres. À appeler en boucle
 * avec le curseur renvoyé jusqu'à `done`. Relançable sans danger : le bot ne
 * modifie que ce qui diffère. Les membres sans compte Discord relié sont ignorés.
 */
export async function resyncDiscordBatch(
  cursor: string | null,
): Promise<ActionResult<{ processed: number; next: string | null; done: boolean }>> {
  try {
    await requireAdmin("users");
    const profiles = await prisma.userProfile.findMany({
      where: cursor ? { id: { gt: cursor } } : {},
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      select: { id: true, clerkUserId: true },
    });

    for (const p of profiles) await syncDiscordRoles(p.clerkUserId);

    const last = profiles.at(-1);
    return {
      ok: true,
      data: {
        processed: profiles.length,
        next: last?.id ?? null,
        done: profiles.length < BATCH_SIZE,
      },
    };
  } catch (err) {
    return failure(err);
  }
}
