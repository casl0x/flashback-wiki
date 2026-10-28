-- CreateEnum
CREATE TYPE "GroupeType" AS ENUM ('GROUPE', 'ENTREPRISE', 'SERVICE_PUBLIC');

-- CreateTable
CREATE TABLE "groupe_categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "type" "GroupeType" NOT NULL,

    CONSTRAINT "groupe_categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "groupes" ADD COLUMN "type" "GroupeType" NOT NULL DEFAULT 'GROUPE',
ADD COLUMN "categorie_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "groupe_categories_type_nom_key" ON "groupe_categories"("type", "nom");

-- CreateIndex
CREATE INDEX "groupes_type_idx" ON "groupes"("type");

-- AddForeignKey
ALTER TABLE "groupes" ADD CONSTRAINT "groupes_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "groupe_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
