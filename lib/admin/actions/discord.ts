"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { syncDiscordRoles } from "@/lib/bot-sync";
import { prisma } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
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

/**
 * Envoie au bot l'état des membres de l'organisation admin Clerk, qu'ils aient ou non un profil
 * sur le wiki (le lot précédent ne parcourt que les profils). Relançable sans danger.
 */
export async function resyncOrgMembersDiscord(): Promise<ActionResult<{ processed: number }>> {
  try {
    await requireAdmin("users");
    const orgId = process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID;
    if (!orgId) return { ok: false, error: "NEXT_PUBLIC_CLERK_ADMIN_ORG_ID manquant." };

    const client = await clerkClient();
    const userIds: string[] = [];
    for (let offset = 0; ; offset += 100) {
      const { data } = await client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit: 100,
        offset,
      });
      for (const m of data) {
        const id = m.publicUserData?.userId;
        if (id) userIds.push(id);
      }
      if (data.length < 100) break;
    }

    for (const id of userIds) await syncDiscordRoles(id);
    return { ok: true, data: { processed: userIds.length } };
  } catch (err) {
    return failure(err);
  }
}
