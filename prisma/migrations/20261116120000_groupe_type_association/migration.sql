-- Nouveau type de groupe « Association » (un groupe civil, côté groupes et non côté parcours).
-- IF NOT EXISTS : tolère une valeur déjà ajoutée à la main dans la base.
ALTER TYPE "GroupeType" ADD VALUE IF NOT EXISTS 'ASSOCIATION';
