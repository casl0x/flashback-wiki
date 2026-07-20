/*
  Warnings:

  - You are about to drop the column `userProfileId` on the `social_links` table. All the data in the column will be lost.
  - Added the required column `creatorRoleId` to the `social_links` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "social_links" DROP CONSTRAINT "social_links_userProfileId_fkey";

-- AlterTable
ALTER TABLE "social_links" DROP COLUMN "userProfileId",
ADD COLUMN     "creatorRoleId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_creatorRoleId_fkey" FOREIGN KEY ("creatorRoleId") REFERENCES "creator_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
