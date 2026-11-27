-- Favoris : joueurs et personnages mis en favori par un compte.
CREATE TYPE "FavoriteKind" AS ENUM ('PLAYER', 'CHARACTER');

ALTER TABLE "UserProfile" ADD COLUMN "showFavorites" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "kind" "FavoriteKind" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorites_userProfileId_kind_targetId_key" ON "favorites"("userProfileId", "kind", "targetId");

CREATE INDEX "favorites_kind_targetId_idx" ON "favorites"("kind", "targetId");

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
