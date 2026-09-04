-- AlterTable
ALTER TABLE "creator_posts" ADD COLUMN     "characterId" TEXT;

-- AddForeignKey
ALTER TABLE "creator_posts" ADD CONSTRAINT "creator_posts_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
