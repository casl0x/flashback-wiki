import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Exécute une lecture en la retentant (pool saturé, Neon qui se réveille après
 * une veille…) : 2 retries espacés de 400 ms puis 1,2 s. Si ça échoue encore,
 * l'erreur remonte : un problème de base ne doit pas devenir un faux
 * « introuvable » (404) mis en cache par unstable_cache.
 */
export async function withDbRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const delays = [400, 1200];
  for (const delay of delays) {
    try {
      return await fn();
    } catch (error) {
      console.error(`${label} (retry dans ${delay} ms)`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return await fn();
}

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
  type: "GROUPE" | "ENTREPRISE" | "SERVICE_PUBLIC" | "ASSOCIATION";
  statut: "INDE" | "GANG" | "ORGA" | "GM" | "CIVIL" | null;
  dissous: boolean;
  juridiction?: "NORD" | "SUD" | "LES_DEUX" | null;
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

  // Fiches « autre acteur » du même personnage (liste publique) : pseudos de
  // tous les acteurs, et fiche à montrer en priorité dans la liste.
  acteurs?: string[];
  acteurPrincipalId?: string;
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
