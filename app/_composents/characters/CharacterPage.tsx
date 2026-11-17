import { MentionText } from "@/app/_composents/MentionText";
import { InlineNotice } from "@/app/_composents/notice/InlineNotice";
import { SuggestButton } from "@/app/_composents/user/SuggestEditButton";
import type { CharacterPageData } from "@/lib/character-page";
import type { Character } from "@/lib/db";
import { youtubeThumbnail } from "@/lib/media-embed";
import { splitDescription } from "@/lib/utils";
import { Lock, Skull } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import ActeurSwitch from "./ActeurSwitch";
import { OtherCharacters, PlayerPanel } from "./CharacterAside";
import CharacterContributors from "./CharacterContributors";
import CharacterHero from "./CharacterHero";
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
  const parts = splitDescription(c.description);
  const histoire = parts.histoire;
  const prison = parts.prison.trim();
  const cause = parts.mort.trim();
  const firstName = c.nom.split(/\s+/)[0];

  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      <CharacterHero c={c} />

      <div className="mx-auto flex max-w-295 flex-wrap items-start gap-8 px-4 pb-16 pt-8 sm:px-5">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7">
          <ActeurSwitch acteurs={c.acteurs} />

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

          {(histoire.trim() || prison || cause) && (
            <section
              aria-labelledby="histoire-h"
              className="flex flex-col gap-3"
            >
              <SectionTitle id="histoire-h">Histoire</SectionTitle>
              {histoire.trim() && (
                <p className="m-0 whitespace-pre-wrap wrap-break-word text-[16px] leading-relaxed text-[#D5D7DD]">
                  <MentionText
                    text={histoire.replace(/\r\n?/g, "\n").replace(/\\n/g, "\n")}
                  />
                </p>
              )}
              {prison && (
                <aside className="mt-1 rounded-lg border border-[#2A3A5E] border-l-4 border-l-[#3B5BA5] bg-[#101725] px-4 py-3">
                  <div className="mb-1 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#8AB4FF]">
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                    Motif de l’incarcération
                  </div>
                  <p className="m-0 whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed text-[#D5DDEE]">
                    <MentionText text={prison} />
                  </p>
                </aside>
              )}
              {cause && (
                <aside className="mt-1 rounded-lg border border-[#5A2A2D] border-l-4 border-l-[#E5484D] bg-[#1E1214] px-4 py-3">
                  <div className="mb-1 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#FF8A8E]">
                    <Skull className="h-3.5 w-3.5" aria-hidden />
                    Cause de la mort
                  </div>
                  <p className="m-0 whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed text-[#E8D5D6]">
                    <MentionText text={cause} />
                  </p>
                </aside>
              )}
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
