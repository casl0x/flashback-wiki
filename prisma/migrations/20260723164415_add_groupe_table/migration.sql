/*
  Warnings:

  - You are about to drop the column `groupe` on the `characters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "characters" DROP COLUMN "groupe",
ADD COLUMN     "groupe_id" TEXT;

-- CreateTable
CREATE TABLE "groupes" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groupes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groupes_slug_key" ON "groupes"("slug");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_groupe_id_fkey" FOREIGN KEY ("groupe_id") REFERENCES "groupes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
