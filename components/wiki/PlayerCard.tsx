"use client";

import { Character } from "@/lib/db";
import { Player } from "@prisma/client";
import { Badge } from "../ui/badge";

type PartialPlayer = Pick<
  Player,
  "id" | "pseudo" | "stream" | "lienChaine" | "reseaux"
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

  return (
    <div className="bg-elevated rounded-xl p-4 border border-border">
      {/* Header joueur */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold border bg-card border-border text-text-secondary shrink-0">
          {playerName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-display font-bold text-[15px] text-text-primary tracking-wide">
            {playerName}
          </p>
          <p className="text-xs text-text-muted">
            {others.length + 1} personnage{others.length + 1 > 1 ? "s" : ""}{" "}
            joué{others.length + 1 > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Chaîne / Stream */}
      {pl.lienChaine && (
        <a
          href={pl.lienChaine}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] text-accent-light hover:underline mb-3"
        >
          <i className="ti ti-brand-twitch" aria-hidden="true" />
          {pl.stream ? "Stream en direct" : "Chaîne de streaming"}
        </a>
      )}

      {/* Réseaux sociaux */}

      {reseaux.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {reseaux.map(([nom, lien]) => {
            const icon = RESEAU_ICONS[nom.toLowerCase()] ?? "ti-link";
            return (
              <a
                key={nom}
                href={lien}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-card border border-border text-text-secondary hover:text-accent-light hover:border-border-accent transition-colors"
              >
                <i className={`ti ${icon}`} aria-hidden="true" />
                {nom}
              </a>
            );
          })}
        </div>
      )}

      {/* Autres personnages */}
      {others.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold text-text-faint uppercase tracking-[.8px] mb-1.5">
            Autres personnages
          </p>
          <div className="flex flex-col gap-1">
            {others.map((o) => (
              <button
                key={o.id}
                onClick={() => onNavigate(o)}
                className="flex items-center justify-between px-2.5 py-1.5 bg-card border border-border rounded-lg hover:border-border-mid transition-all text-left w-full"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border bg-elevated border-border text-text-muted shrink-0">
                    {o.nom.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-text-primary truncate">
                      {o.nom}
                    </p>
                    {o.metier && (
                      <p className="text-[11px] text-text-muted truncate">
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
