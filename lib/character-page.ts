import { prisma } from "@/lib/db";
import { detectSoundPlatform, type SoundPlatform } from "@/lib/media-embed";
import { relationKind, type RelationKind } from "@/lib/relation-kinds";
import { detectStreamPlatform, type StreamPlatform } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

// ─── Données de la fiche personnage (refonte) ────────────────────────────────
// Tout est mis à plat ici pour que les composants n'aient qu'à afficher.

export type EtatVie = "EN_VIE" | "MORT" | "PARTI" | "DISPARU" | "PRISON";

export type VersionTag = { id: string; label: string; color: string };

export type GroupeTag = { id: string; slug: string; nom: string; color: string | null };

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

export type CharacterPageData = {
  id: string;
  nom: string;
  role: "civil" | "illegal" | null;
  metier: string | null;
  description: string | null;
  lienReddif: string | null;
  imageUrl: string | null;
  etatVie: EtatVie;
  locationX: number | null;
  locationY: number | null;
  versions: VersionTag[];
  parcours: ParcoursStep[];
  sounds: CharacterSound[];
  relations: LinkedCharacter[];
  player: {
    id: string;
    pseudo: string;
    lienChaine: string | null;
    platform: StreamPlatform | null;
    reseaux: Record<string, string>;
    badges: string[];
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

function jobOf(memberships: Membership[], metier: string | null): string | null {
  const last = sortMemberships(memberships).at(-1);
  if (!last) return metier;
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

async function loadCharacterPage(id: string): Promise<CharacterPageData | null> {
  const c = await prisma.character.findUnique({
    where: { id },
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
  const relations = [
    ...c.relationsA.map((r) => toLinked(r.id, r.typeRelation, r.personnageB)),
    ...c.relationsB.map((r) => toLinked(r.id, r.typeRelationInverse, r.personnageA)),
  ];

  const others: OtherCharacter[] = (c.player?.characters ?? [])
    .map((o) => {
      const v = [...o.versions].sort(byVersion).at(-1);
      return {
        id: o.id,
        nom: o.nom,
        imageUrl: o.imageUrl,
        version: v ? toVersionTag(v) : null,
        job: jobOf(o.groupes, o.metier),
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
    metier: c.metier,
    description: c.description,
    lienReddif: c.lienReddif,
    imageUrl: c.imageUrl,
    etatVie: c.etatVie as EtatVie,
    locationX: c.locationX,
    locationY: c.locationY,
    versions: [...c.versions].sort(byVersion).map(toVersionTag),
    parcours: sortMemberships(c.groupes).map((m) => ({
      key: m.id,
      version: m.version ? toVersionTag(m.version) : null,
      groupe: { id: m.groupe.id, slug: m.groupe.slug, nom: m.groupe.nom, color: m.groupe.color },
      grade: m.grade?.nom ?? null,
      matricule: m.matricule,
    })),
    sounds: c.sounds.map((s) => ({
      id: s.id,
      titre: s.titre,
      artiste: s.artiste,
      url: s.url,
      platform: detectSoundPlatform(s.url, s.platform),
    })),
    relations,
    player: c.player
      ? {
          id: c.player.id,
          pseudo: c.player.pseudo.trim() || "Joueur",
          lienChaine: c.player.lienChaine,
          platform: detectStreamPlatform(c.player.lienChaine),
          reseaux: normalizeReseaux(c.player.reseaux),
          badges: c.player.badges,
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
