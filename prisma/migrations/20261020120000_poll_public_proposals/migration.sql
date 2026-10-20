-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "allowProposals" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PollOption" ADD COLUMN     "proposedBy" TEXT;
