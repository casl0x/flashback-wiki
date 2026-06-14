import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Player ──────────────────────────────────────────────────────────────────
export type Player = {
  id: string;
  pseudo: string;
  stream: boolean;
  lienChaine: string | null;
  reseaux: Record<string, string>;
  badges: string[];
  createdAt: string;
};

// ─── Version ─────────────────────────────────────────────────────────────────
export type Version = {
  id: string;
  label: string;
  description: string | null;
  color: string | null;
  createdAt: string;
};

// ─── Character ───────────────────────────────────────────────────────────────
export type Character = {
  id: string;
  nom: string;
  role: "civil" | "illegal" | null;
  metier: string | null;
  groupe: string | null;
  description: string | null;
  lienReddif: string | null;
  imageUrl: string | null;
  playerId: string | null;
  versionId: string | null;
  createdAt: string;
  etatVie: string | null;

  // Relations incluses par /api/data
  player?: Pick<
    Player,
    "id" | "pseudo" | "stream" | "lienChaine" | "reseaux" | "badges"
  > | null;
  version?: Pick<Version, "id" | "label" | "color"> | null;
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
    metier: string | null;
    groupe: string | null; // ← nouveau
    player_pseudo: string | null;
  };
};
