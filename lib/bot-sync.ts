import "server-only";

import { prisma } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Synchronise les rôles Discord d'un membre avec le bot (byCasloxGuard).
 *
 * Envoie l'état COMPLET du membre (rôle dans l'organisation admin + badges) ;
 * le bot applique les règles définies dans son dashboard (/admin/bot de bycaslox),
 * ajoute les rôles mérités et retire ceux qui ne le sont plus.
 *
 * Ne lève jamais d'erreur : une panne du bot ne doit pas bloquer le site.
 * Sans BOT_API_URL / BOT_SITE_KEY, ne fait rien (utile en local).
 */
export async function syncDiscordRoles(
  clerkUserId: string,
  options: { joinGuild?: boolean } = {},
): Promise<void> {
  const botUrl = process.env.BOT_API_URL;
  const siteKey = process.env.BOT_SITE_KEY;
  if (!botUrl || !siteKey) return;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);

    const discord = user.externalAccounts.find(
      (a) => a.provider === "discord" || a.provider === "oauth_discord",
    );
    // Pas de compte Discord relié : rien à synchroniser.
    if (!discord?.providerUserId) return;

    const adminOrgId = process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID;
    let role: string | null = null;
    if (adminOrgId) {
      const memberships = await client.users.getOrganizationMembershipList({
        userId: clerkUserId,
      });
      role =
        memberships.data.find((m) => m.organization.id === adminOrgId)?.role ??
        null;
    }

    const profile = await prisma.userProfile.findUnique({
      where: { clerkUserId },
      select: { badges: true },
    });

    // Le jeton Discord ne sert qu'à ajouter le membre au serveur (inscription).
    let accessToken: string | undefined;
    if (options.joinGuild) {
      const tokens = await client.users.getUserOauthAccessToken(
        clerkUserId,
        "discord",
      );
      accessToken = tokens.data[0]?.token;
    }

    const res = await fetch(`${botUrl.replace(/\/$/, "")}/sync-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-site-key": siteKey,
      },
      body: JSON.stringify({
        siteUserId: clerkUserId,
        discordUserId: discord.providerUserId,
        role,
        badges: profile?.badges ?? [],
        ...(accessToken ? { accessToken } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error("[bot-sync] échec", res.status, await res.text());
    }
  } catch (err) {
    console.error("[bot-sync] erreur", err);
  }
}
