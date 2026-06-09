"use client";

import { Badge } from "@/components/ui/badge";
import PlayerCard from "@/components/wiki/PlayerCard";

import { Character } from "@/lib/db";
import dynamic from "next/dynamic";
import Image from "next/image";
import { SuggestEditButton } from "../user/SuggestEditButton";
import CharacterCard from "./CharacterCard";

const CharacterMapWidget = dynamic(
  () => import("@/components/wiki/CharacterMapWidget"),
  { ssr: false },
);

type Props = {
  character: Character;
  allCharacters: Character[];
  onBack: () => void;
  onNavigate: (c: Character) => void;
};

export default function CharacterDetail({
  character: c,
  allCharacters,
  onBack,
  onNavigate,
}: Props) {
  const rels = c.relations ?? [];
  const others = allCharacters.filter(
    (x) => x.playerId === c.playerId && x.id !== c.id,
  );

  const loc = c as Character & {
    locationX?: number | null;
    locationY?: number | null;
  };

  const hasLocation = loc.locationX != null && loc.locationY != null;

  return (
    <div className="flex-1 p-3 sm:p-5 overflow-y-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary mb-3.5 transition-colors bg-transparent border-none cursor-pointer"
      >
        <i className="ti ti-arrow-left" aria-hidden="true" /> Retour
      </button>

      <div className="flex flex-col gap-3">
        {/* Fiche personnage */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          {/* Header : image + infos */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3.5 mb-4 pb-3.5 border-b border-border">
            {/* Image */}
            <div className="rounded-xl shrink-0 overflow-hidden border border-border bg-elevated flex items-center justify-center self-center sm:self-auto">
              {c.imageUrl && (
                <Image
                  src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_320,h_175,c_fill,g_face/${c.imageUrl}`}
                  width={320}
                  height={175}
                  className="w-full h-full object-cover"
                  alt={c.nom}
                  unoptimized
                />
              )}
            </div>

            {/* Infos texte */}
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-[18px] sm:text-[20px] text-text-primary tracking-wide">
                {c.nom}
              </h2>
              {c.metier && (
                <p className="text-[13px] text-text-muted mb-1">
                  Métier : {c.metier}
                </p>
              )}
              {c.groupe && (
                <p className="text-[13px] text-text-muted mb-1">
                  Groupe : {c.groupe}
                </p>
              )}
              {/* Badges version + role */}
              <div className="flex items-center gap-1.5 flex-wrap pt-3">
                {c.version && (
                  <Badge
                    variant="outline"
                    style={{
                      color: c.version.color ?? "var(--accent)",
                      borderColor: `${c.version.color ?? "var(--accent)"}40`,
                      background: `${c.version.color ?? "var(--accent)"}18`,
                    }}
                  >
                    {c.version.id}
                  </Badge>
                )}
                {c.role && (
                  <Badge variant="outline" className="capitalize">
                    {c.role === "civil" ? "Civil" : "Illégal"}
                  </Badge>
                )}
              </div>

              {/* Bouton suggestion — sous les badges, discret */}
              <div className="mt-3">
                <SuggestEditButton character={c} />
              </div>
            </div>

            {/* Mini carte desktop */}
            {hasLocation && (
              <div className="hidden sm:block ml-auto w-64 xl:w-72">
                <CharacterMapWidget
                  characterId={c.id}
                  name={c.nom}
                  x={loc.locationX!}
                  y={loc.locationY!}
                  imageUrl={c.imageUrl}
                  role={c.role}
                  versionColor={c.version?.color ?? null}
                  height={130}
                />
              </div>
            )}
          </div>

          {/* Mini carte mobile */}
          {hasLocation && (
            <div className="mb-4 sm:hidden">
              <CharacterMapWidget
                characterId={c.id}
                name={c.nom}
                x={loc.locationX!}
                y={loc.locationY!}
                imageUrl={c.imageUrl}
                role={c.role}
                versionColor={c.version?.color ?? null}
                height={130}
              />
            </div>
          )}

          {c.description && (
            <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
              {c.description}
            </p>
          )}

          {(c.lienReddif || c.player?.reseaux?.youtube) && (
            <div className="pb-4">
              <a
                href={c.lienReddif ?? c.player?.reseaux?.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] text-accent-light hover:underline mb-3"
              >
                <i className="ti ti-brand-youtube" aria-hidden="true" />
                Voir les rediffusions sur YouTube
              </a>
            </div>
          )}

          {rels.length > 0 && (
            <div>
              <p className="text-[9px] font-semibold text-text-faint uppercase tracking-[.8px] mb-2">
                Relations
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                {rels.map((r) => {
                  const full = allCharacters.find(
                    (ch) => ch.id === r.linked.id,
                  );
                  if (!full) return null;
                  return (
                    <CharacterCard
                      key={r.id}
                      character={full}
                      onClick={() => onNavigate(full)}
                      hidePlayer
                      relationTag={r.type_relation ?? undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <PlayerCard player={c.player} others={others} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
