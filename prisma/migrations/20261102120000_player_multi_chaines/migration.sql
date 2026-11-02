-- Un joueur peut streamer sur plusieurs chaînes (ex. Twitch + Kick).
-- "lien_chaine" (texte unique) devient "chaines" (tableau), avec reprise
-- de la valeur existante comme premier élément.

ALTER TABLE "players" ADD COLUMN "chaines" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "players"
SET "chaines" = ARRAY["lien_chaine"]
WHERE "lien_chaine" IS NOT NULL AND "lien_chaine" <> '';

ALTER TABLE "players" DROP COLUMN "lien_chaine";
