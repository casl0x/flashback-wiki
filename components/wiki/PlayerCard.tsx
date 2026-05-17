"use client";

import { Character } from "@/lib/db";
import { Player } from "@prisma/client";
import { ExternalLink, Radio } from "lucide-react";
import { PlayerBadges } from "../admin/PlayerBadges";
import { Badge } from "../ui/badge";

type PartialPlayer = Pick<
  Player,
  "id" | "pseudo" | "stream" | "lienChaine" | "reseaux" | "badges"
>;

const RESEAU_ICONS: Record<string, string> = {
  twitch: "ti-brand-twitch",
  youtube: "ti-brand-youtube",
  twitter: "ti-brand-twitter",
  x: "ti-brand-x",
  tiktok: "ti-brand-tiktok",
  instagram: "ti-brand-instagram",
  discord: "ti-brand-discord",
};

type Props = {
  player: PartialPlayer | null | undefined;
  others: Character[];
  onNavigate: (c: Character) => void;
};

export default function PlayerCard({ player: pl, others, onNavigate }: Props) {
  if (!pl) return null;
  const playerName = pl.pseudo.trim() || "Joueur";
  const reseaux = Object.entries(pl.reseaux ?? {});
  const totalChars = others.length + 1;
  const hasSocials = pl.lienChaine || reseaux.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      {/* Header — même style que CharacterDetail */}
      <div className="flex items-center gap-3.5 mb-4 pb-3.5 border-b border-border">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold bg-elevated border border-border text-text-secondary">
            {playerName.slice(0, 2).toUpperCase()}
          </div>
          {pl.stream && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
          )}
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
          <div className="flex flex-col gap-1.5">
            {pl.lienChaine && (
              <a
                href={pl.lienChaine}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 bg-elevated rounded-lg border border-transparent hover:border-border-mid transition-all"
              >
                <div className="flex items-center gap-2">
                  {pl.stream ? (
                    <Radio className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  ) : (
                    <i className="ti ti-brand-twitch text-accent-light text-[13px] shrink-0" />
                  )}
                  <span
                    className={`text-[12px] font-medium ${pl.stream ? "text-green-400" : "text-accent-light"}`}
                  >
                    {pl.stream ? "En live maintenant" : "Chaîne de streaming"}
                  </span>
                  {pl.stream && (
                    <span className="text-[9px] font-bold text-green-400 bg-green-400/10 border border-green-400/25 px-1.5 py-0.5 rounded-full animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <ExternalLink className="w-3 h-3 text-text-muted shrink-0" />
              </a>
            )}
            {reseaux.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1">
                {reseaux.map(([nom, lien]) => {
                  const icon = RESEAU_ICONS[nom.toLowerCase()] ?? "ti-link";
                  return (
                    <a
                      key={nom}
                      href={lien}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-elevated border border-border text-text-secondary hover:text-accent-light hover:border-border-accent transition-colors"
                    >
                      <i className={`ti ${icon}`} aria-hidden="true" />
                      {nom}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Autres personnages */}
      {others.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold text-text-faint uppercase tracking-[.8px] mb-2">
            Autres personnages
          </p>
          <div className="flex flex-col gap-1.5">
            {others.map((o) => (
              <button
                key={o.id}
                onClick={() => onNavigate(o)}
                className="flex items-center justify-between px-3 py-2 bg-elevated rounded-lg border border-transparent hover:border-border-mid transition-all text-left w-full"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border bg-card border-border text-text-muted shrink-0">
                    {o.nom.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-text-primary truncate">
                      {o.nom}
                    </p>
                    {o.metier && (
                      <p className="text-[10px] text-text-faint truncate">
                        {o.metier}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {o.version ? (
                    <Badge
                      variant="outline"
                      style={{
                        color: o.version.color ?? "var(--accent)",
                        borderColor: `${o.version.color ?? "var(--accent)"}40`,
                        background: `${o.version.color ?? "var(--accent)"}18`,
                      }}
                    >
                      {o.version.id}
                    </Badge>
                  ) : o.versionId ? (
                    <Badge variant="outline">{o.versionId}</Badge>
                  ) : null}
                  {o.role && (
                    <Badge variant="ghost">
                      {o.role === "civil" ? "Civil" : "Illégal"}
                    </Badge>
                  )}
                  <i
                    className="ti ti-chevron-right text-text-muted text-[12px]"
                    aria-hidden="true"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
