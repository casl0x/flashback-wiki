// Classe un libellé de relation libre (typeRelation / typeRelationInverse)
// dans une catégorie, pour placer le lien dans l'arbre de la fiche perso.

export type RelationKind =
  | "parent"
  | "fratrie"
  | "enfant"
  | "couple"
  | "marie"
  | "ex"
  | "grand-parent"
  | "oncle-tante"
  | "cousin"
  | "neveu-niece"
  | "petit-enfant"
  | "autre";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const startsWithAny = (text: string, words: string[]) =>
  words.some((w) => text === w || text.startsWith(`${w} `) || text.startsWith(`${w}-`));

/** L'ordre des tests compte : « grand-mère » avant « mère », « ex-femme » avant « femme »… */
export function relationKind(label: string | null | undefined): RelationKind {
  if (!label) return "autre";
  const t = normalize(label);

  if (/^ex\b|^ex-/.test(t)) return "ex";

  if (/^(arriere-)?grand(s|e|es)?[- ](pere|mere|parent)/.test(t)) return "grand-parent";
  if (/^(arriere-)?petit(e|s|es)?[- ](fils|fille|enfant)/.test(t)) return "petit-enfant";
  if (startsWithAny(t, ["oncle", "tante", "grand-oncle", "grand-tante"])) return "oncle-tante";
  if (startsWithAny(t, ["cousin", "cousine", "cousins", "cousines"])) return "cousin";
  if (startsWithAny(t, ["neveu", "niece", "neveux", "nieces"])) return "neveu-niece";

  if (
    startsWithAny(t, [
      "pere", "mere", "parent", "papa", "maman",
      "beau-pere", "belle-mere", "pere adoptif", "mere adoptive",
    ])
  )
    return "parent";
  if (
    startsWithAny(t, [
      "frere", "soeur", "demi-frere", "demi-soeur", "jumeau", "jumelle",
      "demi frere", "demi soeur", "frangin", "frangine",
    ])
  )
    return "fratrie";
  if (
    startsWithAny(t, ["fils", "fille", "enfant", "beau-fils", "belle-fille"])
  )
    return "enfant";

  if (startsWithAny(t, ["mari", "femme", "epoux", "epouse", "marie", "mariee", "marie avec", "mariee avec"]))
    return "marie";
  if (
    startsWithAny(t, [
      "en couple", "couple", "copain", "copine", "petit ami", "petite amie",
      "petit-ami", "petite-amie", "compagnon", "compagne", "fiance", "fiancee", "amant", "amante",
    ])
  )
    return "couple";

  return "autre";
}

export const EXTENDED_GROUPS: { kind: RelationKind; label: string }[] = [
  { kind: "grand-parent", label: "Grands-parents" },
  { kind: "oncle-tante", label: "Oncles et tantes" },
  { kind: "cousin", label: "Cousins" },
  { kind: "neveu-niece", label: "Neveux et nièces" },
  { kind: "petit-enfant", label: "Petits-enfants" },
];
