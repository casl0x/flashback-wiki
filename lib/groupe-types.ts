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
