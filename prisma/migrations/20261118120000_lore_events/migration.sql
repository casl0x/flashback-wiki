-- Lore : événements marquants par version, avec clips et liens vers personnages / groupes.
CREATE TABLE "lore_events" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "resume" TEXT NOT NULL,
    "major" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "clips" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version_id" TEXT NOT NULL,

    CONSTRAINT "lore_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lore_event_characters" (
    "lore_event_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,

    CONSTRAINT "lore_event_characters_pkey" PRIMARY KEY ("lore_event_id","character_id")
);

CREATE TABLE "lore_event_groupes" (
    "lore_event_id" TEXT NOT NULL,
    "groupe_id" TEXT NOT NULL,

    CONSTRAINT "lore_event_groupes_pkey" PRIMARY KEY ("lore_event_id","groupe_id")
);

CREATE INDEX "lore_events_version_id_ordre_idx" ON "lore_events"("version_id", "ordre");
CREATE INDEX "lore_event_characters_character_id_idx" ON "lore_event_characters"("character_id");
CREATE INDEX "lore_event_groupes_groupe_id_idx" ON "lore_event_groupes"("groupe_id");

ALTER TABLE "lore_events" ADD CONSTRAINT "lore_events_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lore_event_characters" ADD CONSTRAINT "lore_event_characters_lore_event_id_fkey" FOREIGN KEY ("lore_event_id") REFERENCES "lore_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lore_event_characters" ADD CONSTRAINT "lore_event_characters_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lore_event_groupes" ADD CONSTRAINT "lore_event_groupes_lore_event_id_fkey" FOREIGN KEY ("lore_event_id") REFERENCES "lore_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lore_event_groupes" ADD CONSTRAINT "lore_event_groupes_groupe_id_fkey" FOREIGN KEY ("groupe_id") REFERENCES "groupes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
