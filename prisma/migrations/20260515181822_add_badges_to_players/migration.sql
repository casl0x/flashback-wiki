-- AlterTable
ALTER TABLE "players" ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY[]::TEXT[];
