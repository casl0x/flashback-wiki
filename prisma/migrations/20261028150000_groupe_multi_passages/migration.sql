-- Un perso peut apparaître plusieurs fois dans le même groupe (même version comprise).
DROP INDEX "character_groupes_character_id_groupe_id_version_id_key";

-- CreateIndex
CREATE INDEX "character_groupes_character_id_idx" ON "character_groupes"("character_id");
