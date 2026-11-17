// Les natures de groupe et la section du site où chacune vit.
export type GroupeType = "GROUPE" | "ENTREPRISE" | "SERVICE_PUBLIC" | "ASSOCIATION";

export const GROUPE_TYPES: GroupeType[] = ["GROUPE", "ENTREPRISE", "SERVICE_PUBLIC", "ASSOCIATION"];

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
  ASSOCIATION: {
    base: "/associations",
    label: "Association",
    plural: "Associations",
    kicker: "Association",
  },
};

/** Types des groupes qui apparaissent dans le parcours (métier) d'un perso. Les autres (groupes, associations) sont côté « groupes ». */
export const PARCOURS_TYPES: GroupeType[] = ["ENTREPRISE", "SERVICE_PUBLIC"];

/** Types de groupe qui se rangent dans des catégories libres, gérées dans l'admin. */
export const CATEGORIE_TYPES: GroupeType[] = ["ENTREPRISE", "SERVICE_PUBLIC"];

export const groupeHref = (g: { slug: string; type: GroupeType }) =>
  `${GROUPE_TYPE_META[g.type].base}/${g.slug}`;

// Catégorie d'un groupe (type GROUPE), stockée dans `statut`.
export type GroupeStatut = "INDE" | "GANG" | "ORGA" | "GM" | "CIVIL";

export const GROUPE_STATUTS: GroupeStatut[] = ["INDE", "GANG", "ORGA", "GM", "CIVIL"];

export const GROUPE_STATUT_LABEL: Record<GroupeStatut, string> = {
  INDE: "Indé",
  GANG: "Gang",
  ORGA: "Orga",
  GM: "GM",
  CIVIL: "Civil",
};

/**
 * Types de groupe dont les membres ont un champ libre « numéro » (matricule…).
 * Les entreprises n'en ont plus : leur juridiction se règle sur l'entreprise elle-même.
 */
export const MATRICULE_TYPES: GroupeType[] = ["SERVICE_PUBLIC"];

/** Libellé par défaut de ce champ selon le type de groupe. */
export const MATRICULE_LABEL_DEFAULT: Partial<Record<GroupeType, string>> = {
  SERVICE_PUBLIC: "matricule",
};

/** Valeurs proposées en liste pour le champ numéro de certains types ; sans entrée, le champ est un texte libre. */
export const MATRICULE_OPTIONS: Partial<Record<GroupeType, string[]>> = {};

// Juridiction d'une entreprise (champ `juridiction` du groupe).
export type GroupeJuridiction = "NORD" | "SUD" | "LES_DEUX";

export const GROUPE_JURIDICTIONS: GroupeJuridiction[] = ["NORD", "SUD", "LES_DEUX"];

export const GROUPE_JURIDICTION_LABEL: Record<GroupeJuridiction, string> = {
  NORD: "Nord",
  SUD: "Sud",
  LES_DEUX: "Les deux",
};
