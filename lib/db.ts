import { neon } from "@neondatabase/serverless";

export function getDb() {
  return neon(process.env.DATABASE_URL!, {
    fetchOptions: { cache: "no-store" },
  });
}

export type Player = {
  id: string;
  pseudo: string;
  stream: boolean;
  lien_chaine: string | null;
  reseaux: Record<string, string>;
  created_at?: string;
};

export type Character = {
  id: string;
  nom: string;
  role: "civil" | "illegal" | "fdo" | null;
  description: string | null;
  player_id: string;
  metier: string | null;
  lien_reddit: string | null;
  created_at?: string;
  // champs enrichis par /api/data
  player?: Player | null;
  relations?: Relation[];
};

export type Relation = {
  id: string;
  personnage_a: string;
  personnage_b: string;
  type_relation: string | null;
  created_at?: string;
  linked?: {
    id: string;
    nom: string;
    role: "civil" | "illegal" | "fdo" | null;
    metier: string | null;
    player_pseudo: string;
  };
};

export type Version = {
  id: string;
  label: string;
  description: string | null;
  color: string;
  created_at?: string;
};

export type Tab = "characters" | "players" | "versions";
