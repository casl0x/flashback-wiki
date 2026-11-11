/**
 * Permissions de l'admin, par section.
 *
 * Deux niveaux, basés sur le rôle du membre dans l'organisation Clerk :
 *  - `org:admin`  → accès complet (utilisateurs, points, annonces, sondages…)
 *  - autre rôle (ex. `org:member`) → "éditeur" : uniquement les sections
 *    listées dans EDITOR_SECTIONS.
 *
 * Fichier sans dépendance serveur : importable par le middleware, les
 * server components et la barre latérale (client).
 */

export type AdminSection =
  | "dashboard"
  | "moderation"
  | "characters"
  | "players"
  | "groupes"
  | "categories"
  | "versions"
  | "creators"
  | "announcements"
  | "polls"
  | "suggestions"
  | "users";

export type AdminLevel = "admin" | "editor";

/** Sections ouvertes aux éditeurs. Tout le reste est réservé aux admins. */
export const EDITOR_SECTIONS: readonly AdminSection[] = [
  "dashboard",
  "moderation",
  "characters",
  "players",
  "groupes",
  "suggestions",
];

export const FULL_ADMIN_ROLE = "org:admin";

export function levelFromRole(role: string | null | undefined): AdminLevel {
  return role === FULL_ADMIN_ROLE ? "admin" : "editor";
}

export function canAccess(level: AdminLevel | null | undefined, section: AdminSection): boolean {
  if (level === "admin") return true;
  if (level === "editor") return EDITOR_SECTIONS.includes(section);
  return false;
}

/** /admin/characters/12 → "characters" ; /admin → "dashboard" ; inconnu → null. */
export function sectionFromPath(pathname: string): AdminSection | null {
  const m = pathname.match(/^\/admin(?:\/([^/?#]+))?/);
  if (!m) return null;
  const seg = m[1];
  if (!seg) return "dashboard";
  const known: AdminSection[] = [
    "moderation", "characters", "players", "groupes", "categories",
    "versions", "creators", "announcements", "polls", "suggestions", "users",
  ];
  return (known as string[]).includes(seg) ? (seg as AdminSection) : null;
}
