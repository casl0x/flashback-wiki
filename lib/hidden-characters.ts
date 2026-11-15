import "server-only";

/**
 * Persos masqués du site public (ex. perso de test) : identifiants séparés par
 * des virgules dans la variable d'environnement HIDDEN_CHARACTER_IDS.
 * Ils restent visibles dans l'admin ; la fiche directe n'est accessible qu'aux admins.
 */
const IDS = (process.env.HIDDEN_CHARACTER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isHiddenCharacter(id: string): boolean {
  return IDS.includes(id);
}

/** Filtre Prisma pour un `Character` : `where: { ...visibleCharacter }`. */
export const visibleCharacter = IDS.length ? { id: { notIn: IDS } } : {};
