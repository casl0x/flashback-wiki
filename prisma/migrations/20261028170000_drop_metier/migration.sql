-- Le poste d'un perso est déduit de son entreprise / service public (le code ne lit plus `metier`).
-- ATTENTION : suppression définitive, les valeurs déjà saisies sont perdues.
ALTER TABLE "characters" DROP COLUMN "metier";
ALTER TABLE "Suggestion" DROP COLUMN "metier";
