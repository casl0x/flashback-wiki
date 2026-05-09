"use client";

import { Badge } from "@/components/ui/badge";

type Props = {
  totalChars: number;
  totalPlayers: number;
  totalVersions: number;
  query: string;
  onQueryChange: (q: string) => void;
};

export default function NavBar({
  totalChars,
  totalPlayers,
  totalVersions,
  query,
  onQueryChange,
}: Props) {
  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold">
          ⚡
        </div>
        <div>
          <div className="font-display font-bold text-[17px] text-text-primary">
            FLASH<span className="text-accent-light">BACK</span>
          </div>
          <div className="text-[11px] text-text-faint">— Wiki WL</div>
        </div>
      </div>

      <div className="flex-1 max-w-md">
        <input
          type="text"
          placeholder="Rechercher un personnage..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="h-9 w-full bg-elevated border border-border-mid rounded-lg px-3 py-1.5 text-xs placeholder:text-text-faint outline-none"
          suppressHydrationWarning
        />
      </div>

      <div className="flex items-center gap-3">
        {[
          [totalChars, "persos"],
          [totalPlayers, "joueurs"],
          [totalVersions, "versions"],
        ].map(([val, label]) => (
          <Badge key={String(label)}>
            {val} {label}
          </Badge>
        ))}
      </div>
    </nav>
  );
}
