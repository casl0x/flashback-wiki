import "server-only";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { canAccess, levelFromRole, type AdminLevel, type AdminSection } from "./permissions";

/**
 * Niveau d'accès d'un utilisateur à l'admin : membre de l'organisation Clerk
 * NEXT_PUBLIC_CLERK_ADMIN_ORG_ID, avec "admin" si son rôle est `org:admin`,
 * "editor" sinon (accès limité, cf. permissions.ts). null = pas d'accès.
 */
export async function getAdminLevel(userId: string | null | undefined): Promise<AdminLevel | null> {
  if (!userId) return null;
  const orgId = process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID;
  if (!orgId) return null;
  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({ userId });
  const m = memberships.data.find((x) => x.organization.id === orgId);
  return m ? levelFromRole(m.role) : null;
}

/**
 * Vrai si l'utilisateur peut accéder à l'admin. Sans `section`, tout membre de
 * l'organisation passe ; avec `section`, le niveau doit couvrir cette section.
 */
export async function isAdminUser(
  userId: string | null | undefined,
  section?: AdminSection,
): Promise<boolean> {
  const level = await getAdminLevel(userId);
  if (!level) return false;
  return section ? canAccess(level, section) : true;
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
export async function requireAdmin(section?: AdminSection): Promise<string> {
  const { userId } = await auth();
  if (!userId || !(await isAdminUser(userId, section))) throw new NotAdminError();
  return userId;
}

/** Infos de l'admin connecté, pour le pied de la barre latérale. */
export async function currentAdminSummary() {
  const user = await currentUser();
  if (!user) return null;
  const name = user.username ?? user.firstName ?? user.emailAddresses[0]?.emailAddress ?? "Admin";
  return { name, imageUrl: user.imageUrl, level: await getAdminLevel(user.id) };
}
