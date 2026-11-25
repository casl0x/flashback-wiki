import { syncDiscordRoles } from "@/lib/bot-sync";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

/**
 * Webhook Clerk → resynchronise les rôles Discord.
 * Événements à activer dans Clerk : user.created, organizationMembership.created,
 * organizationMembership.updated, organizationMembership.deleted.
 * Secret : CLERK_WEBHOOK_SIGNING_SECRET.
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  const adminOrgId = process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID;

  if (evt.type === "user.created") {
    // À l'inscription : ajoute aussi le membre au serveur Discord.
    await syncDiscordRoles(evt.data.id, { joinGuild: true });
  } else if (
    evt.type === "organizationMembership.created" ||
    evt.type === "organizationMembership.updated" ||
    evt.type === "organizationMembership.deleted"
  ) {
    // Seule l'organisation admin du site pilote les rôles.
    if (!adminOrgId || evt.data.organization.id === adminOrgId) {
      await syncDiscordRoles(evt.data.public_user_data.user_id);
    }
  }

  return new Response("OK", { status: 200 });
}
