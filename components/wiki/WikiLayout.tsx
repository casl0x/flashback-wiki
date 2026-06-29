"use client";

import NavBar from "@/components/NavBar";
import Sidebar from "@/components/Sidebar";
import { Version } from "@/lib/db";
import { useState } from "react";
import { SearchProvider } from "./SearchContext";

type Props = {
  totalChars: number;
  totalPlayers: number;
  totalVersions: number;
  versions: Version[];
  counts: Record<string, number>;
  totalRels: number;
  children: React.ReactNode;
};

/**
 * Wrapper utilisé par les pages Server (HomePage, CharacterPage)
 * pour gérer l'état du menu mobile côté client.
 */
export default function WikiLayout({
  totalChars,
  totalPlayers,
  totalVersions,
  children,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <SearchProvider value={{ query, setQuery }}>
      <main className="flex min-h-screen flex-col bg-background text-text-primary">
        <NavBar
          totalChars={totalChars}
          totalPlayers={totalPlayers}
          totalVersions={totalVersions}
          query={query}
          onQueryChange={setQuery}
          onMenuToggle={() => setMenuOpen((o) => !o)}
          menuOpen={menuOpen}
        />
        <div className="flex flex-1">
          <Sidebar
            totalChars={totalChars}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
          />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>
    </SearchProvider>
  );
}
