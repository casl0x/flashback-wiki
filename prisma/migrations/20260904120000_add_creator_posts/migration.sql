-- CreateTable
CREATE TABLE "creator_posts" (
    "id" TEXT NOT NULL,
    "type" "CreatorType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "platform" "SocialPlatform",
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorRoleId" TEXT NOT NULL,

    CONSTRAINT "creator_posts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "creator_posts" ADD CONSTRAINT "creator_posts_creatorRoleId_fkey" FOREIGN KEY ("creatorRoleId") REFERENCES "creator_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
