"use client";

import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";

type Props = {
  totalChars: number;
  totalPlayers: number;
  totalVersions: number;
  query?: string;
  onQueryChange?: (q: string) => void;
};

export default function NavBar({
  totalChars,
  totalPlayers,
  totalVersions,
  query,
  onQueryChange,
}: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="sticky top-0 z-10 border-b border-border bg-card/95 px-5 py-3 backdrop-blur-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-bold text-white">
            ⚡
          </div>
          <div className="mr-2">
            <div className="font-display text-[17px] font-bold text-text-primary">
              FLASH<span className="text-accent-light">BACK</span>
            </div>
            <div className="text-[11px] text-text-faint">— Wiki WL</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-center lg:justify-end">
          {query !== undefined && onQueryChange && (
            <div className="w-full lg:max-w-md">
              <input
                type="text"
                placeholder="Rechercher un personnage..."
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-border-mid bg-elevated px-3 py-1.5 text-xs outline-none placeholder:text-text-faint"
                suppressHydrationWarning
              />
            </div>
          )}

          <div className="flex items-center gap-2">
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
