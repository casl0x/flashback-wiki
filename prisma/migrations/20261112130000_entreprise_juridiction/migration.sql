-- Les entreprises affichent désormais « juridiction » devant le numéro de leurs membres
-- (les services publics gardent « matricule »). Idempotent : ne touche que le libellé par défaut.
UPDATE "groupes" SET "matricule_label" = 'juridiction'
WHERE "type" = 'ENTREPRISE' AND "matricule_label" = 'matricule';
