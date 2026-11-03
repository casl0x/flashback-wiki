-- CreateTable
CREATE TABLE "creator_post_likes" (
    "creatorPostId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_post_likes_pkey" PRIMARY KEY ("creatorPostId","clerkUserId")
);

-- AddForeignKey
ALTER TABLE "creator_post_likes" ADD CONSTRAINT "creator_post_likes_creatorPostId_fkey" FOREIGN KEY ("creatorPostId") REFERENCES "creator_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
