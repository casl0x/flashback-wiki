-- CreateTable
CREATE TABLE "creator_post_characters" (
    "creatorPostId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "creator_post_characters_pkey" PRIMARY KEY ("creatorPostId","characterId")
);

-- AddForeignKey
ALTER TABLE "creator_post_characters" ADD CONSTRAINT "creator_post_characters_creatorPostId_fkey" FOREIGN KEY ("creatorPostId") REFERENCES "creator_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_post_characters" ADD CONSTRAINT "creator_post_characters_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
