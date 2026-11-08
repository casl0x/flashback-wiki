-- Historique des points attribués à la main par un admin.
CREATE TABLE "PointEntry" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userProfileId" TEXT NOT NULL,
    "character_id" TEXT,

    CONSTRAINT "PointEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PointEntry_userProfileId_createdAt_idx" ON "PointEntry"("userProfileId", "createdAt");
CREATE INDEX "PointEntry_character_id_idx" ON "PointEntry"("character_id");

ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
