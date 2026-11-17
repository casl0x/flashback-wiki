-- Juridiction d'une entreprise (Nord, Sud, Les deux).
-- Tolérant (IF NOT EXISTS / duplicate_object) : peut avoir été appliqué à la main dans la base.
DO $$ BEGIN
  CREATE TYPE "GroupeJuridiction" AS ENUM ('NORD', 'SUD', 'LES_DEUX');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "juridiction" "GroupeJuridiction";
