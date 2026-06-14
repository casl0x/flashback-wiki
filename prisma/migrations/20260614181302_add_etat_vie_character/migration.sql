-- CreateEnum
CREATE TYPE "EtatVie" AS ENUM ('EN_VIE', 'MORT', 'PARTI');

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "etat_vie" "EtatVie" NOT NULL DEFAULT 'EN_VIE';
