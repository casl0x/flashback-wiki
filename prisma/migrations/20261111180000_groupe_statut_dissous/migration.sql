-- Statut des groupes illégaux (Indé, Gang, Orga, GM) et drapeau « dissous ».
-- Tolérant (IF NOT EXISTS / duplicate_object) : peut avoir été appliqué à la main dans la base.
DO $$ BEGIN
  CREATE TYPE "GroupeStatut" AS ENUM ('INDE', 'GANG', 'ORGA', 'GM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "statut" "GroupeStatut";
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "dissous" BOOLEAN NOT NULL DEFAULT false;
