-- Modèles de grades (listes réutilisables, copiées dans un groupe depuis l'éditeur de groupe).
-- Tolérant (IF NOT EXISTS / ON CONFLICT) : rejouable sans erreur ; les modèles de départ ne sont ajoutés que s'ils manquent.
CREATE TABLE IF NOT EXISTS "grade_modeles" (
  "id" TEXT NOT NULL,
  "nom" TEXT NOT NULL,
  "type" "GroupeType",
  "ordre" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "grade_modeles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "grade_modeles_nom_key" ON "grade_modeles"("nom");

CREATE TABLE IF NOT EXISTS "grade_modele_items" (
  "id" TEXT NOT NULL,
  "nom" TEXT NOT NULL,
  "color" TEXT,
  "ordre" INTEGER NOT NULL DEFAULT 0,
  "modele_id" TEXT NOT NULL,
  CONSTRAINT "grade_modele_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "grade_modele_items_modele_id_idx" ON "grade_modele_items"("modele_id");
DO $$ BEGIN
  ALTER TABLE "grade_modele_items"
    ADD CONSTRAINT "grade_modele_items_modele_id_fkey"
    FOREIGN KEY ("modele_id") REFERENCES "grade_modeles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Modèles de départ.
INSERT INTO "grade_modeles" ("id", "nom", "type", "ordre") VALUES
  ('gm_mc', 'MC', 'GROUPE', 0),
  ('gm_gang', 'Gang', 'GROUPE', 1),
  ('gm_orga', 'Orga', 'GROUPE', 2),
  ('gm_resto', 'Restaurant / boîte', 'ENTREPRISE', 3),
  ('gm_meca', 'Mécano', 'ENTREPRISE', 4),
  ('gm_std', 'Entreprise standard', 'ENTREPRISE', 5)
ON CONFLICT DO NOTHING;

INSERT INTO "grade_modele_items" ("id", "nom", "color", "ordre", "modele_id") VALUES
  ('gmi_mc_0', 'Prés', '#E4B44A', 0, 'gm_mc'),
  ('gmi_mc_1', 'VP', '#8AB4FF', 1, 'gm_mc'),
  ('gmi_mc_2', 'Sergent d''armes', '#6EE7A0', 2, 'gm_mc'),
  ('gmi_mc_3', 'Membre', '#FF8A8E', 3, 'gm_mc'),
  ('gmi_mc_4', 'Prospect', '#C98BFF', 4, 'gm_mc'),
  ('gmi_gang_0', 'Lead', '#E4B44A', 0, 'gm_gang'),
  ('gmi_gang_1', 'Membres', '#8AB4FF', 1, 'gm_gang'),
  ('gmi_gang_2', 'Habitants', '#6EE7A0', 2, 'gm_gang'),
  ('gmi_orga_0', 'Lead', '#E4B44A', 0, 'gm_orga'),
  ('gmi_orga_1', 'Membres', '#8AB4FF', 1, 'gm_orga'),
  ('gmi_resto_0', 'Patron', '#E4B44A', 0, 'gm_resto'),
  ('gmi_resto_1', 'Serveur', '#8AB4FF', 1, 'gm_resto'),
  ('gmi_meca_0', 'Patron', '#E4B44A', 0, 'gm_meca'),
  ('gmi_meca_1', 'Mécano', '#8AB4FF', 1, 'gm_meca'),
  ('gmi_std_0', 'Patron', '#E4B44A', 0, 'gm_std'),
  ('gmi_std_1', 'Employé', '#8AB4FF', 1, 'gm_std')
ON CONFLICT DO NOTHING;
