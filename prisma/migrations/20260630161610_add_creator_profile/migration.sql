-- CreateEnum
CREATE TYPE "CreatorType" AS ENUM ('ARTISTE', 'EDITEUR');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('TWITTER', 'TIKTOK', 'YOUTUBE', 'INSTAGRAM', 'TWITCH', 'AUTRE');

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "creator_roles" (
    "id" TEXT NOT NULL,
    "type" "CreatorType" NOT NULL,
    "displayOnWiki" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "creator_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_roles_userProfileId_type_key" ON "creator_roles"("userProfileId", "type");

-- AddForeignKey
ALTER TABLE "creator_roles" ADD CONSTRAINT "creator_roles_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
