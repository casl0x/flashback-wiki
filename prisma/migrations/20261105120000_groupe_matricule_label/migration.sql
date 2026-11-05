-- Libellé affiché devant le matricule des services publics (« matricule » par défaut, vide = valeur seule).
ALTER TABLE "groupes" ADD COLUMN "matricule_label" TEXT DEFAULT 'matricule';
