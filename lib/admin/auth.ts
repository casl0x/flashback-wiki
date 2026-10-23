import "server-only";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

/** Un admin = un membre de l'organisation Clerk NEXT_PUBLIC_CLERK_ADMIN_ORG_ID. */
export async function isAdminUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const orgId = process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID;
  if (!orgId) return false;
  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({ userId });
  return memberships.data.some((m) => m.organization.id === orgId);
}

export class NotAdminError extends Error {
  constructor() {
    super("Action réservée aux admins.");
  }
}

/**
 * À appeler en tête de chaque server action et route API d'admin :
 * le middleware protège les pages /admin, mais pas les actions ni /api.
 */
export async function requireAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId || !(await isAdminUser(userId))) throw new NotAdminError();
  return userId;
}

/** Infos de l'admin connecté, pour le pied de la barre latérale. */
export async function currentAdminSummary() {
  const user = await currentUser();
  if (!user) return null;
  const name = user.username ?? user.firstName ?? user.emailAddresses[0]?.emailAddress ?? "Admin";
  return { name, imageUrl: user.imageUrl };
}
