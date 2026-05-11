-- CreateEnum
CREATE TYPE "Role" AS ENUM ('civil', 'illegal');

-- CreateTable
CREATE TABLE "versions" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#8880a8',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "stream" BOOLEAN NOT NULL DEFAULT false,
    "lien_chaine" TEXT,
    "reseaux" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "Role",
    "description" TEXT,
    "metier" TEXT,
    "groupe" TEXT,
    "lien_reddif" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "player_id" TEXT,
    "version_id" TEXT,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relations" (
    "id" TEXT NOT NULL,
    "type_relation" TEXT,
    "typeRelationInverse" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personnage_a" TEXT NOT NULL,
    "personnage_b" TEXT NOT NULL,

    CONSTRAINT "relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "relations_personnage_a_personnage_b_key" ON "relations"("personnage_a", "personnage_b");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relations" ADD CONSTRAINT "relations_personnage_a_fkey" FOREIGN KEY ("personnage_a") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relations" ADD CONSTRAINT "relations_personnage_b_fkey" FOREIGN KEY ("personnage_b") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
