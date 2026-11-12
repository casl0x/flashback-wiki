import { MentionText } from "@/app/_composents/MentionText";
import { InlineNotice } from "@/app/_composents/notice/InlineNotice";
import { SuggestButton } from "@/app/_composents/user/SuggestEditButton";
import type { CharacterPageData } from "@/lib/character-page";
import type { Character } from "@/lib/db";
import { youtubeThumbnail } from "@/lib/media-embed";
import Image from "next/image";
import { Suspense } from "react";
import { OtherCharacters, PlayerPanel } from "./CharacterAside";
import CharacterContributors from "./CharacterContributors";
import CharacterHero from "./CharacterHero";
import CharacterMap from "./CharacterMap";
import CharacterParcours from "./CharacterParcours";
import CharacterRelations from "./CharacterRelations";
import CharacterSounds from "./CharacterSounds";
import { CharacterUserNotices } from "./CharacterUserNotices";
import OwnCharacterEditor from "./OwnCharacterEditor";
import SectionTitle from "./SectionTitle";

/** Forme attendue par le bouton « Proposer une modification » (ancien type Character). */
function toSuggestCharacter(c: CharacterPageData): Character {
  return {
    id: c.id,
    nom: c.nom,
    role: c.role,
    groupes: c.parcours.map((p) => p.groupe),
    description: c.description,
    lienReddifs: c.lienReddifs,
    imageUrl: c.imageUrl,
    playerId: c.player?.id ?? null,
    versionId: c.versions.at(-1)?.id ?? null,
    createdAt: "",
    etatVie: c.etatVie,
    player: c.player
      ? {
          id: c.player.id,
          pseudo: c.player.pseudo,
          stream: false,
          chaines: c.player.chaines.map((ch) => ch.url),
          reseaux: c.player.reseaux,
          badges: c.player.badges,
        }
      : null,
  };
}

/** Fiche personnage (refonte), sans le header du site. */
export default function CharacterPage({
  c,
  isOwner = false,
}: {
  c: CharacterPageData;
  isOwner?: boolean;
}) {
  const firstName = c.nom.split(/\s+/)[0];
  const hasLocation = c.locationX != null && c.locationY != null;

  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      <CharacterHero c={c} />

      <div className="mx-auto flex max-w-295 flex-wrap items-start gap-8 px-4 pb-16 pt-8 sm:px-5">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7">
          <CharacterUserNotices characterId={c.id} />

          {isOwner && (
            <OwnCharacterEditor
              characterId={c.id}
              initial={{
                description: c.description ?? "",
                imageUrl: c.imageUrl,
                lienReddifs: c.lienReddifs,
                sounds: c.sounds.map((s) => ({
                  titre: s.titre,
                  artiste: s.artiste,
                  url: s.url,
                })),
              }}
            />
          )}

          {c.lienReddifs.length === 0 && !c.description && (
            <InlineNotice
              tone="info"
              action={{
                render: (
                  <SuggestButton
                    mode="edit"
                    character={toSuggestCharacter(c)}
                    triggerLabel="propose-la"
                    triggerClassName="font-semibold underline text-[#8AB4FF]"
                  />
                ),
              }}
            >
              Cette fiche n’a pas de source. Si tu as un clip ou un live,
            </InlineNotice>
          )}

          {c.description && (
            <section
              aria-labelledby="histoire-h"
              className="flex flex-col gap-3"
            >
              <SectionTitle id="histoire-h">Histoire</SectionTitle>
              <p className="m-0 whitespace-pre-wrap wrap-break-word text-[16px] leading-relaxed text-[#D5D7DD]">
                <MentionText
                  text={c.description
                    .replace(/\r\n?/g, "\n")
                    .replace(/\\n/g, "\n")}
                />
              </p>
            </section>
          )}

          <CharacterParcours steps={c.parcours} etatVie={c.etatVie} />

          <CharacterRelations c={c} />

          {c.lienReddifs.length > 0 && (
            <section
              aria-labelledby="reddifs-h"
              className="flex flex-col gap-3"
            >
              <SectionTitle id="reddifs-h">Rediffusions</SectionTitle>
              <div className="flex flex-col gap-2">
                {c.lienReddifs.map((reddif, i) => {
                  const thumb = youtubeThumbnail(reddif.url);
                  return (
                    <a
                      key={`${reddif.url}-${i}`}
                      href={reddif.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 rounded-[10px] border border-[#23262D] bg-[#15171B] p-3.5 hover:border-[#3A3E47] sm:gap-4.5"
                    >
                      <span className="relative flex h-17 w-30 flex-none items-center justify-center overflow-hidden rounded-md bg-[#22252B] text-[#FF0033] sm:h-24 sm:w-42">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt=""
                            fill
                            unoptimized
                            sizes="168px"
                            className="object-cover"
                          />
                        ) : (
                          <svg
                            aria-hidden
                            width="34"
                            height="24"
                            viewBox="0 0 34 24"
                            fill="currentColor"
                          >
                            <rect width="34" height="24" rx="6" />
                            <path d="M14 7l7 5-7 5z" fill="#fff" />
                          </svg>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-[16px] font-semibold sm:text-[18px]">
                          {reddif.titre ||
                            (c.lienReddifs.length > 1
                              ? `Partie ${i + 1}`
                              : `Revoir l’histoire de ${firstName} sur YouTube`)}
                        </span>
                        <span className="text-[14px] text-[#A3A8B3]">
                          Ouvre YouTube ↗
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          <CharacterSounds sounds={c.sounds} />
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          {c.player && <PlayerPanel player={c.player} />}
          {hasLocation && (
            <CharacterMap
              characterId={c.id}
              name={c.nom}
              x={c.locationX!}
              y={c.locationY!}
              imageUrl={c.imageUrl}
              role={c.role}
              versionColor={c.versions.at(-1)?.color ?? null}
            />
          )}
          {c.player && <OtherCharacters player={c.player} />}
          <div className="flex justify-center rounded-lg border border-dashed border-[#3A3E47] p-3">
            <SuggestButton mode="edit" character={toSuggestCharacter(c)} />
          </div>
        </aside>

        {/* Pleine largeur, sous les deux colonnes : tout en bas de la fiche. */}
        <div className="w-full">
          <Suspense fallback={null}>
            <CharacterContributors characterId={c.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
