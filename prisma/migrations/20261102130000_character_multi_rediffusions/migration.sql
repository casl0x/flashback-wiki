-- Un personnage peut avoir plusieurs liens de rediffusion, dans l'ordre de
-- visionnage choisi par l'admin (pas de lien avec les versions).
-- "lien_reddif" (texte unique) devient "liens_reddif" (tableau), avec
-- reprise de la valeur existante comme premier élément.

ALTER TABLE "characters" ADD COLUMN "liens_reddif" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "characters"
SET "liens_reddif" = ARRAY["lien_reddif"]
WHERE "lien_reddif" IS NOT NULL AND "lien_reddif" <> '';

ALTER TABLE "characters" DROP COLUMN "lien_reddif";
