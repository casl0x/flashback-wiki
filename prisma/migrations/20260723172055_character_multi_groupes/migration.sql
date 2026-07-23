/*
  Warnings:

  - You are about to drop the column `groupe_id` on the `characters` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_groupe_id_fkey";

-- AlterTable
ALTER TABLE "characters" DROP COLUMN "groupe_id";

-- CreateTable
CREATE TABLE "_CharacterGroupes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CharacterGroupes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CharacterGroupes_B_index" ON "_CharacterGroupes"("B");

-- AddForeignKey
ALTER TABLE "_CharacterGroupes" ADD CONSTRAINT "_CharacterGroupes_A_fkey" FOREIGN KEY ("A") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterGroupes" ADD CONSTRAINT "_CharacterGroupes_B_fkey" FOREIGN KEY ("B") REFERENCES "groupes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
