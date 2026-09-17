-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN     "etat_vie" "EtatVie",
ADD COLUMN     "joueur" TEXT,
ADD COLUMN     "lien_reddif" TEXT,
ADD COLUMN     "role" "Role",
ADD COLUMN     "version_id" TEXT;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
