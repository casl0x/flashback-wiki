-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "nom" TEXT,
    "metier" TEXT,
    "groupe" TEXT,
    "description" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
