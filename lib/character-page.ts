import { parseRediffusions, prisma, withDbRetry, type Rediffusion } from "@/lib/db";
import { MATRICULE_TYPES, PARCOURS_TYPES, type GroupeStatut, type GroupeType } from "@/lib/groupe-types";
import { detectSoundPlatform, type SoundPlatform } from "@/lib/media-embed";
import { pickSpouse } from "@/lib/family-tree";
import { loadActeurGroups } from "@/lib/acteurs";
import { ACTEUR_LABEL, relationKind, type RelationKind } from "@/lib/relation-kinds";
import { toPlayerChannel, type PlayerChannel } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

// ─── Données de la fiche personnage (refonte) ────────────────────────────────
// Tout est mis à plat ici pour que les composants n'aient qu'à afficher.

export type EtatVie = "EN_VIE" | "MORT" | "PARTI" | "DISPARU" | "PRISON";

export type VersionTag = { id: string; label: string; color: string };

export type GroupeTag = {
  id: string;
  slug: string;
  nom: string;
  color: string | null;
  type: GroupeType;
  statut: GroupeStatut | null;
  dissous: boolean;
};

export type ParcoursStep = {
  key: string;
  version: VersionTag | null;
  groupe: GroupeTag;
  grade: string | null;
  matricule: string | null;
};

export type LinkedCharacter = {
  relationId: string;
  id: string;
  nom: string;
  imageUrl: string | null;
  label: string; // libellé tel que saisi, ex. « Père », « Ex-femme »
  kind: RelationKind;
  groupe: string | null;
  joueur: string | null;
  version: VersionTag | null;
};

export type ParentsLink = "marie" | "couple" | "ex" | null;

export type CharacterSound = {
  id: string;
  titre: string;
  artiste: string | null;
  url: string;
  platform: SoundPlatform;
};

export type OtherCharacter = {
  id: string;
  nom: string;
  imageUrl: string | null;
  version: VersionTag | null;
  job: string | null;
  etatVie: EtatVie;
};

/** Une fiche du même personnage jouée par un autre acteur (la fiche courante est incluse). */
export type ActeurLink = {
  id: string;
  pseudo: string;
  imageUrl: string | null;
  current: boolean;
};

export type CharacterPageData = {
  id: string;
  nom: string;
  role: "civil" | "illegal" | null;
  description: string | null;
  lienReddifs: Rediffusion[];
  imageUrl: string | null;
  etatVie: EtatVie;
  locationX: number | null;
  locationY: number | null;
  versions: VersionTag[];
  parcours: ParcoursStep[];
  /** Dernier passage côté légal (entreprise / service public) et côté illégal (groupe) : affichés sous le nom. */
  currentLegal: ParcoursStep | null;
  currentIllegal: ParcoursStep | null;
  /** Vide s'il n'y a qu'un acteur ; sinon toutes les fiches du personnage, la plus ancienne d'abord. */
  acteurs: ActeurLink[];
  sounds: CharacterSound[];
  relations: LinkedCharacter[];
  /** Lien entre les deux premiers parents (marié, en couple, ex), s'ils sont renseignés. */
  parentsLink: ParentsLink;
  /** Parmi les enfants de la fiche, ceux qui sont aussi liés comme enfants à son conjoint·e (celui de l'arbre). */
  spouseChildIds: string[];
  /** Parmi les frères et sœurs, ceux qui sont aussi liés comme enfants aux parents de la fiche. */
  parentSiblingIds: string[];
  player: {
    id: string;
    pseudo: string;
    chaines: PlayerChannel[];
    reseaux: Record<string, string>;
    badges: string[];
    imageUrl: string | null;
    totalCharacters: number;
    others: OtherCharacter[];
  } | null;
};

import { versionRank } from "@/lib/version-rank";
export { versionRank };

const byVersion = (a: { id: string }, b: { id: string }) =>
  versionRank(a.id) - versionRank(b.id) || a.id.localeCompare(b.id);

const toVersionTag = (v: { id: string; label: string; color: string }): VersionTag => ({
  id: v.id,
  label: v.label,
  color: v.color,
});

const normalizeReseaux = (value: Prisma.JsonValue): Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "",
    ),
  );
};

const membershipInclude = {
  groupe: true,
  grade: true,
  version: true,
} satisfies Prisma.CharacterGroupeInclude;

type Membership = Prisma.CharacterGroupeGetPayload<{ include: typeof membershipInclude }>;

/** Appartenances dans l'ordre chronologique : par version, puis par `ordre`. */
function sortMemberships(list: Membership[]): Membership[] {
  return [...list].sort(
    (a, b) =>
      versionRank(a.versionId) - versionRank(b.versionId) || a.ordre - b.ordre,
  );
}

/** Parcours d'un perso : seuls les entreprises et services publics y figurent (pas les gangs, etc.). */
function sortParcours(list: Membership[]): Membership[] {
  return sortMemberships(list).filter((m) => PARCOURS_TYPES.includes(m.groupe.type));
}

function toStep(m: Membership): ParcoursStep {
  return {
    key: m.id,
    version: m.version ? toVersionTag(m.version) : null,
    groupe: {
      id: m.groupe.id,
      slug: m.groupe.slug,
      nom: m.groupe.nom,
      color: m.groupe.color,
      type: m.groupe.type,
      statut: m.groupe.statut,
      dissous: m.groupe.dissous,
    },
    grade: m.grade?.nom ?? null,
    matricule: matriculeText(m),
  };
}

/** Dernier passage répondant au filtre, dans l'ordre chronologique. */
function lastStep(list: Membership[], keep: (m: Membership) => boolean): ParcoursStep | null {
  const last = sortMemberships(list).filter(keep).at(-1);
  return last ? toStep(last) : null;
}

/** Texte à afficher pour le matricule : réservé aux services publics, précédé du libellé du groupe s'il y en a un. */
function matriculeText(m: Membership): string | null {
  const value = m.matricule?.trim();
  if (!value || !MATRICULE_TYPES.includes(m.groupe.type)) return null;
  const label = m.groupe.matriculeLabel?.trim();
  return label ? `${label} ${value}` : value;
}

function jobOf(memberships: Membership[]): string | null {
  const last = sortMemberships(memberships).at(-1);
  if (!last) return null;
  return last.grade ? `${last.grade.nom} · ${last.groupe.nom}` : last.groupe.nom;
}

const linkedInclude = {
  player: { select: { pseudo: true } },
  versions: true,
  groupes: { include: membershipInclude },
} satisfies Prisma.CharacterInclude;

type Linked = Prisma.CharacterGetPayload<{ include: typeof linkedInclude }>;

function toLinked(relationId: string, label: string | null, c: Linked): LinkedCharacter {
  const lastVersion = [...c.versions].sort(byVersion).at(-1);
  const lastMembership = sortMemberships(c.groupes).at(-1);
  return {
    relationId,
    id: c.id,
    nom: c.nom,
    imageUrl: c.imageUrl,
    label: label?.trim() || "Lien",
    kind: relationKind(label),
    groupe: lastMembership?.groupe.nom ?? null,
    joueur: c.player?.pseudo ?? null,
    version: lastVersion ? toVersionTag(lastVersion) : null,
  };
}

/** Les deux premiers parents sont-ils mariés / en couple / séparés entre eux ? */
async function loadParentsLink(relations: LinkedCharacter[]): Promise<ParentsLink> {
  const parents = relations.filter((r) => r.kind === "parent");
  if (parents.length < 2) return null;
  const [p1, p2] = parents;
  // La paire est stockée triée (A < B).
  const [a, b] = p1.id < p2.id ? [p1.id, p2.id] : [p2.id, p1.id];
  const link = await prisma.relation.findUnique({
    where: { personnageAId_personnageBId: { personnageAId: a, personnageBId: b } },
    select: { typeRelation: true, typeRelationInverse: true },
  });
  if (!link) return null;
  const kind =
    relationKind(link.typeRelation) !== "autre"
      ? relationKind(link.typeRelation)
      : relationKind(link.typeRelationInverse);
  return kind === "marie" || kind === "couple" || kind === "ex" ? kind : null;
}

/** Parmi `kidIds`, ceux qui sont liés comme enfants à au moins un des `parentIds`. */
async function linkedChildIds(parentIds: string[], kidIds: string[]): Promise<string[]> {
  if (parentIds.length === 0 || kidIds.length === 0) return [];
  const links = await prisma.relation.findMany({
    where: {
      OR: [
        { personnageAId: { in: parentIds }, personnageBId: { in: kidIds } },
        { personnageBId: { in: parentIds }, personnageAId: { in: kidIds } },
      ],
    },
    select: {
      personnageAId: true,
      personnageBId: true,
      typeRelation: true,
      typeRelationInverse: true,
    },
  });
  const linked = new Set<string>();
  for (const l of links) {
    const parentIsA = parentIds.includes(l.personnageAId) && kidIds.includes(l.personnageBId);
    const kid = parentIsA ? l.personnageBId : l.personnageAId;
    // typeRelation décrit B vu de A ; typeRelationInverse décrit A vu de B.
    const kidLabel = parentIsA ? l.typeRelation : l.typeRelationInverse;
    const parentLabel = parentIsA ? l.typeRelationInverse : l.typeRelation;
    if (relationKind(kidLabel) === "enfant" || relationKind(parentLabel) === "parent") {
      linked.add(kid);
    }
  }
  return kidIds.filter((id) => linked.has(id));
}

const idsOf = (relations: LinkedCharacter[], kind: RelationKind) =>
  relations.filter((r) => r.kind === kind).map((r) => r.id);

/** Enfants de la fiche qui sont aussi ceux de son conjoint·e (celui de l'arbre). */
function loadSpouseChildIds(relations: LinkedCharacter[]): Promise<string[]> {
  const spouse = pickSpouse(relations);
  return linkedChildIds(spouse ? [spouse.id] : [], idsOf(relations, "enfant"));
}

/** Frères et sœurs de la fiche qui sont aussi liés comme enfants à ses parents. */
function loadParentSiblingIds(relations: LinkedCharacter[]): Promise<string[]> {
  return linkedChildIds(idsOf(relations, "parent"), idsOf(relations, "fratrie"));
}

async function loadCharacterPage(id: string): Promise<CharacterPageData | null> {
  // `null` = fiche réellement introuvable (404) ; une erreur de base remonte.
  return withDbRetry("Failed to load character page", () => loadCharacterPageUnsafe(id));
}

async function loadCharacterPageUnsafe(id: string): Promise<CharacterPageData | null> {
  const c = await prisma.character.findUnique({
    where: { id },
    // Une seule requête SQL (jointures) au lieu d'une par relation imbriquée :
    // chaque requête prenait une connexion du pool (limite 5) → saturation.
    relationLoadStrategy: "join",
    include: {
      versions: true,
      groupes: { include: membershipInclude },
      sounds: { orderBy: [{ ordre: "asc" }, { createdAt: "asc" }] },
      relationsA: { include: { personnageB: { include: linkedInclude } } },
      relationsB: { include: { personnageA: { include: linkedInclude } } },
      player: {
        include: {
          characters: {
            where: { NOT: { id } },
            include: { versions: true, groupes: { include: membershipInclude } },
          },
        },
      },
    },
  });

  if (!c) return null;

  // Point de vue de ce perso : dans relationsA il est « A », le libellé décrit B ;
  // dans relationsB il est « B », c'est le libellé inverse qui décrit A.
  // Les liens « Autre acteur » alimentent le sélecteur d'acteur, pas l'arbre familial.
  const relations = [
    ...c.relationsA
      .filter((r) => r.typeRelation !== ACTEUR_LABEL)
      .map((r) => toLinked(r.id, r.typeRelation, r.personnageB)),
    ...c.relationsB
      .filter((r) => r.typeRelationInverse !== ACTEUR_LABEL)
      .map((r) => toLinked(r.id, r.typeRelationInverse, r.personnageA)),
  ];

  const acteurIds = (await loadActeurGroups()).get(id) ?? [];
  const acteurRows = acteurIds.length
    ? await prisma.character.findMany({
        where: { id: { in: acteurIds } },
        select: {
          id: true,
          imageUrl: true,
          createdAt: true,
          player: { select: { pseudo: true } },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      })
    : [];
  const acteurs: ActeurLink[] = acteurRows.map((a) => ({
    id: a.id,
    pseudo: a.player?.pseudo.trim() || "Joueur inconnu",
    imageUrl: a.imageUrl,
    current: a.id === id,
  }));

  const parentsLink = await loadParentsLink(relations);
  const [spouseChildIds, parentSiblingIds] = await Promise.all([
    loadSpouseChildIds(relations),
    loadParentSiblingIds(relations),
  ]);

  const others: OtherCharacter[] = (c.player?.characters ?? [])
    .map((o) => {
      const v = [...o.versions].sort(byVersion).at(-1);
      return {
        id: o.id,
        nom: o.nom,
        imageUrl: o.imageUrl,
        version: v ? toVersionTag(v) : null,
        job: jobOf(o.groupes),
        etatVie: o.etatVie as EtatVie,
      };
    })
    // Les plus récents d'abord, puis par nom.
    .sort(
      (a, b) =>
        versionRank(b.version?.id) - versionRank(a.version?.id) ||
        a.nom.localeCompare(b.nom, "fr"),
    );

  return {
    id: c.id,
    nom: c.nom,
    role: c.role,
    description: c.description,
    lienReddifs: parseRediffusions(c.lienReddifs),
    imageUrl: c.imageUrl,
    etatVie: c.etatVie as EtatVie,
    locationX: c.locationX,
    locationY: c.locationY,
    versions: [...c.versions].sort(byVersion).map(toVersionTag),
    parcours: sortParcours(c.groupes).map(toStep),
    currentLegal: lastStep(c.groupes, (m) => PARCOURS_TYPES.includes(m.groupe.type)),
    currentIllegal: lastStep(c.groupes, (m) => !PARCOURS_TYPES.includes(m.groupe.type)),
    acteurs,
    sounds: c.sounds.map((s) => ({
      id: s.id,
      titre: s.titre,
      artiste: s.artiste,
      url: s.url,
      platform: detectSoundPlatform(s.url, s.platform),
    })),
    relations,
    parentsLink,
    spouseChildIds,
    parentSiblingIds,
    player: c.player
      ? {
          id: c.player.id,
          pseudo: c.player.pseudo.trim() || "Joueur",
          chaines: c.player.chaines.map(toPlayerChannel),
          reseaux: normalizeReseaux(c.player.reseaux),
          badges: c.player.badges,
          imageUrl: c.player.imageUrl,
          totalCharacters: others.length + 1,
          others,
        }
      : null,
  };
}

export const getCharacterPage = unstable_cache(loadCharacterPage, ["character-page"], {
  revalidate: 300,
  tags: ["wiki-data"],
});

export { cloudinaryUrl, initials } from "@/lib/cloudinary";
