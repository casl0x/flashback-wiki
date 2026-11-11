-- Date de dernière modification (sitemap / SEO). Les lignes existantes sont
-- initialisées à leur date de création.
ALTER TABLE "players"    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "characters" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "groupes"    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "players"    SET "updated_at" = "created_at";
UPDATE "characters" SET "updated_at" = "created_at";
UPDATE "groupes"    SET "updated_at" = "created_at";
