-- Profil public pour tous les utilisateurs :
-- une seule bio sur le profil, visibilité réglable, pseudo unique.

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "profilePublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showStats" BOOLEAN NOT NULL DEFAULT true;

-- Reprend les bios des rôles créateur (fan art puis edit), concaténées.
UPDATE "UserProfile" up
SET "bio" = b.bio
FROM (
  SELECT "userProfileId", string_agg(trim("bio"), E'\n' ORDER BY "type") AS bio
  FROM "creator_roles"
  WHERE "bio" IS NOT NULL AND trim("bio") <> ''
  GROUP BY "userProfileId"
) b
WHERE b."userProfileId" = up."id";

-- La colonne "creator_roles"."bio" n'est plus lue par le code mais reste en base
-- le temps que la version en ligne soit déployée ; elle sera supprimée ensuite.

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_pseudo_key" ON "UserProfile"("pseudo");
