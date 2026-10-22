-- Refonte admin : groupes ordonnés avec grade/matricule, grades par groupe, sons,
-- compte lié à un joueur, champs de version, motif de refus des propositions.
-- Écrit à la main : à relire puis tester sur une copie de la base (branche Neon) avant la prod.

-- 1. Grades par groupe
CREATE TABLE "groupe_grades" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "niveau" TEXT,
    "groupe_id" TEXT NOT NULL,
    CONSTRAINT "groupe_grades_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "groupe_grades_groupe_id_nom_key" ON "groupe_grades"("groupe_id", "nom");
ALTER TABLE "groupe_grades" ADD CONSTRAINT "groupe_grades_groupe_id_fkey"
    FOREIGN KEY ("groupe_id") REFERENCES "groupes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Appartenances perso ↔ groupe (remplace la table implicite "_CharacterGroupes")
-- Une ligne par appartenance et par version : un perso peut être SASP en V5 puis BCSO en V6.
CREATE TABLE "character_groupes" (
    "id" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "matricule" TEXT,
    "character_id" TEXT NOT NULL,
    "groupe_id" TEXT NOT NULL,
    "grade_id" TEXT,
    "version_id" TEXT,
    CONSTRAINT "character_groupes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "character_groupes_character_id_groupe_id_version_id_key"
    ON "character_groupes"("character_id", "groupe_id", "version_id");
CREATE INDEX "character_groupes_groupe_id_idx" ON "character_groupes"("groupe_id");
ALTER TABLE "character_groupes" ADD CONSTRAINT "character_groupes_character_id_fkey"
    FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "character_groupes" ADD CONSTRAINT "character_groupes_groupe_id_fkey"
    FOREIGN KEY ("groupe_id") REFERENCES "groupes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "character_groupes" ADD CONSTRAINT "character_groupes_grade_id_fkey"
    FOREIGN KEY ("grade_id") REFERENCES "groupe_grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "character_groupes" ADD CONSTRAINT "character_groupes_version_id_fkey"
    FOREIGN KEY ("version_id") REFERENCES "versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Reprise des données : dans "_CharacterGroupes", A = characters.id et B = groupes.id.
-- L'ordre d'origine n'est pas connu : tout le monde part à 0, à ajuster dans l'admin.
-- Chaque appartenance reprend la version actuelle du perso (characters.version_id existe encore ici).
INSERT INTO "character_groupes" ("id", "character_id", "groupe_id", "version_id", "ordre")
SELECT gen_random_uuid()::text, cg."A", cg."B", c."version_id", 0
FROM "_CharacterGroupes" cg
JOIN "characters" c ON c."id" = cg."A";

DROP TABLE "_CharacterGroupes";

-- 3. Sons par perso
CREATE TABLE "sounds" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "artiste" TEXT,
    "url" TEXT NOT NULL,
    "platform" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "character_id" TEXT NOT NULL,
    CONSTRAINT "sounds_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "sounds" ADD CONSTRAINT "sounds_character_id_fkey"
    FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Compte lié à un joueur + demandes de lien
ALTER TABLE "UserProfile" ADD COLUMN "player_id" TEXT;
CREATE UNIQUE INDEX "UserProfile_player_id_key" ON "UserProfile"("player_id");
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_player_id_fkey"
    FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "player_link_requests" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "user_profile_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    CONSTRAINT "player_link_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "player_link_requests_user_profile_id_player_id_key"
    ON "player_link_requests"("user_profile_id", "player_id");
ALTER TABLE "player_link_requests" ADD CONSTRAINT "player_link_requests_user_profile_id_fkey"
    FOREIGN KEY ("user_profile_id") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_link_requests" ADD CONSTRAINT "player_link_requests_player_id_fkey"
    FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Versions : ordre des bandes, dates, image d'ambiance, version en cours
ALTER TABLE "versions" ADD COLUMN "ordre" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "versions" ADD COLUMN "date_debut" TIMESTAMP(3);
ALTER TABLE "versions" ADD COLUMN "date_fin" TIMESTAMP(3);
ALTER TABLE "versions" ADD COLUMN "image_url" TEXT;
ALTER TABLE "versions" ADD COLUMN "en_cours" BOOLEAN NOT NULL DEFAULT false;

-- 6. Propositions : motif et message de refus
ALTER TABLE "Suggestion" ADD COLUMN "reject_reason" TEXT;
ALTER TABLE "Suggestion" ADD COLUMN "moderator_message" TEXT;
ALTER TABLE "Suggestion" ADD COLUMN "reviewed_at" TIMESTAMP(3);

-- 7. Plusieurs versions par perso (remplace characters.version_id)
CREATE TABLE "_CharacterVersions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterVersions_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX "_CharacterVersions_B_index" ON "_CharacterVersions"("B");
ALTER TABLE "_CharacterVersions" ADD CONSTRAINT "_CharacterVersions_A_fkey"
    FOREIGN KEY ("A") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CharacterVersions" ADD CONSTRAINT "_CharacterVersions_B_fkey"
    FOREIGN KEY ("B") REFERENCES "versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reprise des données : chaque perso garde sa version actuelle (A = characters.id, B = versions.id).
-- Les persos encore sur "Multiverse" y restent : leur attribuer les vraies versions dans l'admin,
-- puis supprimer la version Multiverse (la table de liaison se nettoie toute seule).
INSERT INTO "_CharacterVersions" ("A", "B")
SELECT "id", "version_id" FROM "characters" WHERE "version_id" IS NOT NULL;

ALTER TABLE "characters" DROP CONSTRAINT "characters_version_id_fkey";
ALTER TABLE "characters" DROP COLUMN "version_id";

-- 8. Séparation de "V3-4" en V3 et V4
-- ⚠ Vérifie l'identifiant réel de la version V3-4 dans la table "versions" et remplace 'V3-4'
--   partout ci-dessous s'il est différent. Si aucune version n'a cet id, cette partie ne fait rien.
INSERT INTO "versions" ("id", "label", "color", "ordre")
SELECT x.id, x.label, x.color, x.ordre
FROM (VALUES ('V3', 'Version 3', '#9AD46B', 3), ('V4', 'Version 4', '#6FD3C1', 4)) AS x(id, label, color, ordre)
WHERE EXISTS (SELECT 1 FROM "versions" WHERE "id" = 'V3-4')
ON CONFLICT ("id") DO NOTHING;

-- Les persos en V3-4 reçoivent V3 ET V4 (à décocher ensuite dans l'admin si besoin).
INSERT INTO "_CharacterVersions" ("A", "B")
SELECT cv."A", x.v FROM "_CharacterVersions" cv, (VALUES ('V3'), ('V4')) AS x(v)
WHERE cv."B" = 'V3-4'
ON CONFLICT DO NOTHING;

-- Pareil pour leurs groupes : une appartenance en V3 et une en V4.
INSERT INTO "character_groupes" ("id", "ordre", "matricule", "character_id", "groupe_id", "grade_id", "version_id")
SELECT gen_random_uuid()::text, cg."ordre", cg."matricule", cg."character_id", cg."groupe_id", cg."grade_id", x.v
FROM "character_groupes" cg, (VALUES ('V3'), ('V4')) AS x(v)
WHERE cg."version_id" = 'V3-4'
ON CONFLICT DO NOTHING;
DELETE FROM "character_groupes" WHERE "version_id" = 'V3-4';

-- Les propositions qui visaient V3-4 passent sur V4.
UPDATE "Suggestion" SET "version_id" = 'V4' WHERE "version_id" = 'V3-4';

DELETE FROM "versions" WHERE "id" = 'V3-4';
