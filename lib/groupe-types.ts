// Les trois natures de groupe et la section du site où chacune vit.
export type GroupeType = "GROUPE" | "ENTREPRISE" | "SERVICE_PUBLIC";

export const GROUPE_TYPES: GroupeType[] = ["GROUPE", "ENTREPRISE", "SERVICE_PUBLIC"];

export const GROUPE_TYPE_META: Record<
  GroupeType,
  { base: string; label: string; plural: string; kicker: string }
> = {
  GROUPE: { base: "/groupes", label: "Groupe", plural: "Groupes", kicker: "Groupe" },
  ENTREPRISE: { base: "/entreprises", label: "Entreprise", plural: "Entreprises", kicker: "Entreprise" },
  SERVICE_PUBLIC: {
    base: "/services-publics",
    label: "Service public",
    plural: "Services publics",
    kicker: "Service public",
  },
};

/** Types des groupes qui apparaissent dans le parcours d'un perso. */
export const PARCOURS_TYPES: GroupeType[] = ["ENTREPRISE", "SERVICE_PUBLIC"];

export const groupeHref = (g: { slug: string; type: GroupeType }) =>
  `${GROUPE_TYPE_META[g.type].base}/${g.slug}`;

// Statut d'un groupe illégal (type GROUPE).
export type GroupeStatut = "INDE" | "GANG" | "ORGA" | "GM";

export const GROUPE_STATUTS: GroupeStatut[] = ["INDE", "GANG", "ORGA", "GM"];

export const GROUPE_STATUT_LABEL: Record<GroupeStatut, string> = {
  INDE: "Indé",
  GANG: "Gang",
  ORGA: "Orga",
  GM: "GM",
};

/** Types de groupe dont les membres ont un champ libre « numéro » (matricule, juridiction…). */
export const MATRICULE_TYPES: GroupeType[] = ["SERVICE_PUBLIC", "ENTREPRISE"];

/** Libellé par défaut de ce champ selon le type de groupe. */
export const MATRICULE_LABEL_DEFAULT: Partial<Record<GroupeType, string>> = {
  SERVICE_PUBLIC: "matricule",
  ENTREPRISE: "juridiction",
};

/** Valeurs proposées en liste pour le champ numéro de certains types ; sans entrée, le champ est un texte libre. */
export const MATRICULE_OPTIONS: Partial<Record<GroupeType, string[]>> = {
  ENTREPRISE: ["Nord", "Sud"],
};
