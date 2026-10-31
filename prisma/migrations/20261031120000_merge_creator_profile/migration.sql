-- Fusionne les réseaux sociaux (jusqu'ici par rôle créateur) sur le profil
-- utilisateur, et supprime la validation du rôle créateur par un admin.

-- 1) social_links : ajoute la colonne userProfileId, la remplit depuis le
--    rôle créateur actuel, puis la rend obligatoire et supprime l'ancienne
--    colonne creatorRoleId.
ALTER TABLE "social_links" ADD COLUMN "userProfileId" TEXT;

UPDATE "social_links" AS sl
SET "userProfileId" = cr."userProfileId"
FROM "creator_roles" AS cr
WHERE cr.id = sl."creatorRoleId";

ALTER TABLE "social_links" ALTER COLUMN "userProfileId" SET NOT NULL;

ALTER TABLE "social_links" DROP CONSTRAINT "social_links_creatorRoleId_fkey";
ALTER TABLE "social_links" DROP COLUMN "creatorRoleId";

ALTER TABLE "social_links" ADD CONSTRAINT "social_links_userProfileId_fkey"
  FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) creator_roles : plus de validation admin, tous les rôles existants
--    (en attente ou refusés) deviennent approuvés.
UPDATE "creator_roles" SET "status" = 'approved' WHERE "status" != 'approved';

-- 3) reports : file de signalements (publications et profils).
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reporterClerkUserId" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);
