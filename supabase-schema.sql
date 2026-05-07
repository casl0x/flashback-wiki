-- =============================================
-- FLASHBACK WL — Schéma SQL (Neon / PostgreSQL)
-- Colle ce SQL dans Neon > SQL Editor
-- =============================================

-- Versions du serveur
CREATE TABLE IF NOT EXISTS versions (
  id          TEXT PRIMARY KEY,        -- ex: "V1", "V2"
  label       TEXT NOT NULL,           -- ex: "Version 1"
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Joueurs
CREATE TABLE IF NOT EXISTS players (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo     TEXT NOT NULL UNIQUE,     -- ex: "Maxime_B"
  discord    TEXT,
  tiktok     TEXT,
  stream_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personnages
CREATE TABLE IF NOT EXISTS characters (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        TEXT NOT NULL,
  job         TEXT NOT NULL,
  description TEXT,
  tags        TEXT[] DEFAULT '{}',
  version_id  TEXT REFERENCES versions(id) ON DELETE RESTRICT,
  player_id   UUID REFERENCES players(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Relations entre personnages
CREATE TABLE IF NOT EXISTS relations (
  id            BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  character_id  BIGINT REFERENCES characters(id) ON DELETE CASCADE,
  target_id     BIGINT REFERENCES characters(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,          -- ex: "Père", "Rival", "Ami"
  UNIQUE(character_id, target_id)
);

-- =============================================
-- Données de démo (optionnel — supprime si besoin)
-- =============================================

INSERT INTO versions (id, label, description) VALUES
  ('V1', 'Version 1', 'Fondation du serveur'),
  ('V2', 'Version 2', 'Refonte urbaine'),
  ('V3', 'Version 3', 'Ère des gangs'),
  ('V4', 'Version 4', 'Reset & WL')
ON CONFLICT (id) DO NOTHING;
