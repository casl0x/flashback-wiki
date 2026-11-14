-- Nouvelle catégorie « Civil » pour les groupes (statut).
-- IF NOT EXISTS : tolère une valeur déjà ajoutée à la main dans la base.
ALTER TYPE "GroupeStatut" ADD VALUE IF NOT EXISTS 'CIVIL';
