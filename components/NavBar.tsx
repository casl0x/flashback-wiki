"use client";

import { Badge } from "@/components/ui/badge";
import { Menu, X } from "lucide-react";
import Image from "next/image";

type Props = {
  totalChars: number;
  totalPlayers: number;
  totalVersions: number;
  query?: string;
  onQueryChange?: (q: string) => void;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
};

export default function NavBar({
  totalChars,
  totalPlayers,
  totalVersions,
  query,
  onQueryChange,
  onMenuToggle,
  menuOpen,
}: Props) {
  const isControlled = query !== undefined && onQueryChange !== undefined;
  const currentQuery = query ?? "";

  return (
   <nav className="sticky top-0 z-20 h-[72px] border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Burger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-text-secondary transition-colors hover:bg-muted lg:hidden"
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="Logo"
            width={48}
            height={48}
            className="rounded-full"
          />
        </div>

        {/* Search + badges */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <input
            type="text"
            placeholder="Rechercher…"
            value={currentQuery}
            onChange={(e) => {
              const value = e.target.value;

              if (isControlled) {
                onQueryChange(value);
              }
            }}
            className="h-8 w-full max-w-45 rounded-lg border border-border-mid bg-elevated px-3 text-xs outline-none placeholder:text-text-faint sm:max-w-xs lg:max-w-md"
            suppressHydrationWarning
          />

          {/* Badges — masqués sur petit mobile */}
          <div className="hidden items-center gap-1.5 sm:flex">
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
        </div>
      </div>
    </nav>
  );
}
