-- Lore : blocs de texte mis en forme (lore hors gameplay) à côté des événements.
CREATE TYPE "LoreKind" AS ENUM ('EVENT', 'TEXT');

ALTER TABLE "lore_events"
    ADD COLUMN "kind" "LoreKind" NOT NULL DEFAULT 'EVENT',
    ADD COLUMN "contenu" TEXT;

ALTER TABLE "lore_events" ALTER COLUMN "resume" SET DEFAULT '';
