"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Character, Player } from "@/lib/db";
import { Badge } from "../ui/badge";

type Props = {
  player: Player | null | undefined;
  others: Character[];
  onNavigate: (c: Character) => void;
};

export default function PlayerCard({ player: pl, others, onNavigate }: Props) {
  if (!pl) return null;
  const playerName = pl.pseudo?.trim() || "Joueur";
  const playerInitial = playerName.charAt(0) || "?";

  return (
    <div className="bg-elevated rounded-xl p-4 border border-border">
      {/* Header joueur */}
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar>
          <AvatarFallback>{playerInitial}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-display font-bold text-[15px] text-text-primary tracking-wide">
            {playerName}
          </p>
          <p className="text-xs text-text-muted">
            {others.length + 1} personnage{others.length + 1 > 1 ? "s" : ""} au
            total
          </p>
        </div>
      </div>

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
                className="flex items-center justify-between px-2.5 py-1.5 bg-card border border-border rounded-lg hover:border-border-accent transition-all text-left w-full"
              >
                <div>
                  <p className="text-[13px] font-medium text-text-primary">
                    {o.name}
                  </p>
                  <p className="text-[11px] text-text-muted">{o.job}</p>
                </div>
                <Badge>{o.version_id}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
