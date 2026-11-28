-- Conversation admin <-> auteur sur une proposition en attente.
CREATE TABLE "suggestion_messages" (
    "id" TEXT NOT NULL,
    "fromAdmin" BOOLEAN NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suggestionId" TEXT NOT NULL,

    CONSTRAINT "suggestion_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "suggestion_messages_suggestionId_createdAt_idx" ON "suggestion_messages"("suggestionId", "createdAt");

ALTER TABLE "suggestion_messages" ADD CONSTRAINT "suggestion_messages_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
