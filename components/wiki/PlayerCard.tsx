"use client";

import { Character } from "@/lib/db";
import { detectStreamPlatform } from "@/lib/utils";
import { Player } from "@prisma/client";
import { PlayerBadges } from "../admin/PlayerBadges";
import { RESEAUX_OPTIONS } from "../admin/PlayersTab";
import CharacterCard from "./CharacterCard";
import {
  KickIcon,
  KICK_COLOR,
  TwitchIcon,
  TWITCH_COLOR,
} from "./PlatformIcons";
import SocialRow from "./SocialRow";

type PartialPlayer = Pick<
  Player,
  "id" | "pseudo" | "stream" | "lienChaine" | "reseaux" | "badges"
>;

type Props = {
  player: PartialPlayer | null | undefined;
  others: Character[];
  onNavigate: (c: Character) => void;
};

export default function PlayerCard({ player: pl, others, onNavigate }: Props) {
  if (!pl) return null;
  const playerName = pl.pseudo.trim() || "Joueur";
  const reseauxMap =
    pl.reseaux && typeof pl.reseaux === "object" && !Array.isArray(pl.reseaux)
      ? (pl.reseaux as Record<string, string>)
      : {};
  const reseaux = Object.entries(reseauxMap);
  const totalChars = others.length + 1;
  const hasSocials = pl.lienChaine || reseaux.length > 0;
  const streamPlatform = detectStreamPlatform(pl.lienChaine);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      {/* Header — même style que CharacterDetail */}
      <div className="flex items-center gap-3.5 mb-4 pb-3.5 border-b border-border">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold bg-elevated border border-border text-text-secondary">
            {playerName.slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-[17px] text-text-primary tracking-wide leading-tight">
            {playerName}
          </h3>
          <p className="text-[12px] text-text-muted mt-0.5">
            {totalChars} personnage{totalChars > 1 ? "s" : ""}
          </p>
          {pl.badges?.length > 0 && (
            <div className="mt-1.5">
              <PlayerBadges badges={pl.badges} size="md" />
            </div>
          )}
        </div>
      </div>

      {/* Chaîne & réseaux */}
      {hasSocials && (
        <div className="mb-4">
          <p className="text-[9px] font-semibold text-text-faint uppercase tracking-[.8px] mb-2">
            Liens
          </p>
          <div className="flex gap-2 border-b">
            {pl.lienChaine && (
              <SocialRow
                href={pl.lienChaine}
                icon={
                  streamPlatform === "kick" ? (
                    <KickIcon className="w-[13px] h-[13px]" />
                  ) : (
                    <TwitchIcon className="w-[13px] h-[13px]" />
                  )
                }
                iconBg={`${streamPlatform === "kick" ? KICK_COLOR : TWITCH_COLOR}18`}
                label={
                  streamPlatform === "kick" ? "Chaîne Kick" : "Chaîne Twitch"
                }
              />
            )}
            {RESEAUX_OPTIONS.map((opt) => {
              const lien = reseauxMap[opt.key];
              if (!lien) return null;
              return (
                <SocialRow
                  key={opt.key}
                  href={lien}
                  icon={<span style={{ color: opt.color }}>{opt.icon}</span>}
                  iconBg={`${opt.color}18`}
                  label={opt.label}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Autres personnages */}
      {others.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold text-text-faint uppercase tracking-[.8px] mb-2">
            Autres personnages
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {others.map((o) => (
              <CharacterCard
                key={o.id}
                character={o}
                onClick={() => onNavigate(o)}
                hidePlayer
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
