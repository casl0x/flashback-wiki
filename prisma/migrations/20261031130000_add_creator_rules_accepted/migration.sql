-- Trace de l'acceptation des règles de publication créateur (une fois par compte).
ALTER TABLE "UserProfile" ADD COLUMN "creatorRulesAcceptedAt" TIMESTAMP(3);
