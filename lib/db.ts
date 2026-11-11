import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Player ──────────────────────────────────────────────────────────────────
export type Player = {
  id: string;
  pseudo: string;
  stream: boolean;
  chaines: string[];
  reseaux: Record<string, string>;
  badges: string[];
  imageUrl: string | null;
  createdAt: string;
};

// ─── Version ─────────────────────────────────────────────────────────────────
export type Version = {
  id: string;
  label: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  ordre: number;
  dateDebut: string | null;
  dateFin: string | null;
  imageUrl: string | null;
  enCours: boolean;
};

// ─── Groupe ───────────────────────────────────────────────────────────────────
export type Groupe = {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  imageUrl: string | null;
  color: string | null;
  createdAt: string;
  type: "GROUPE" | "ENTREPRISE" | "SERVICE_PUBLIC";
  statut: "INDE" | "GANG" | "ORGA" | "GM" | null;
  dissous: boolean;
  categorieId: string | null;
  /** Nombre de persos distincts (renseigné par fetchWikiData). */
  membersCount?: number;
  /** Versions où le groupe a eu des membres (renseigné par fetchWikiData). */
  versionIds?: string[];
};

// ─── Character ───────────────────────────────────────────────────────────────
export type Rediffusion = { url: string; titre: string | null };

/** Lit le champ Json `lienReddifs` sans supposer sa forme (valeurs anciennes/corrompues ignorées). */
export function parseRediffusions(value: unknown): Rediffusion[] {
  if (!Array.isArray(value)) return [];
  const out: Rediffusion[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const url = typeof item.url === "string" ? item.url : "";
    if (!url) continue;
    const titre = typeof item.titre === "string" && item.titre ? item.titre : null;
    out.push({ url, titre });
  }
  return out;
}

export type Character = {
  id: string;
  nom: string;
  role: "civil" | "illegal" | null;
  groupes: Pick<Groupe, "id" | "slug" | "nom" | "color">[];
  description: string | null;
  lienReddifs: Rediffusion[];
  imageUrl: string | null;
  playerId: string | null;
  versionId: string | null;
  createdAt: string;
  etatVie: string | null;

  // Relations incluses par /api/data
  player?: Pick<
    Player,
    "id" | "pseudo" | "stream" | "chaines" | "reseaux" | "badges"
  > | null;
  version?: Pick<
    Version,
    "id" | "label" | "color" | "description" | "ordre"
  > | null;
  versions?: Pick<Version, "id" | "label" | "color" | "description" | "ordre">[];
  relations?: LinkedRelation[];

  locationX?: number | null;
  locationY?: number | null;
};

export type LinkedRelation = {
  id: string;
  type_relation: string | null;
  linked: {
    id: string;
    nom: string;
    role: "civil" | "illegal" | null;
      groupes: Pick<Groupe, "id" | "slug" | "nom" | "color">[];
    imageUrl: string | null; // ← ajouter
    player_pseudo: string | null;
  };
};
