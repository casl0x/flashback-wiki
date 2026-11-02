-- Chaque lien de rediffusion peut désormais avoir un titre personnalisé.
-- "liens_reddif" passe de TEXT[] à JSONB, chaque élément devenant
-- { "url": "...", "titre": null }, sans titre pour les liens existants.

ALTER TABLE "characters" ADD COLUMN "liens_reddif_new" JSONB NOT NULL DEFAULT '[]';

UPDATE "characters"
SET "liens_reddif_new" = (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('url', u, 'titre', NULL)), '[]'::jsonb)
  FROM unnest("liens_reddif") AS u
);

ALTER TABLE "characters" DROP COLUMN "liens_reddif";
ALTER TABLE "characters" RENAME COLUMN "liens_reddif_new" TO "liens_reddif";
