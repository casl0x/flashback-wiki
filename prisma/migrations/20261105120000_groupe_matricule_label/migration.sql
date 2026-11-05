-- Libellé affiché devant le matricule des services publics (« matricule » par défaut, vide = valeur seule).
-- IF NOT EXISTS : tolère une colonne déjà ajoutée à la main dans la base.
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "matricule_label" TEXT DEFAULT 'matricule';
