"use client";

import NavBar from "@/components/wiki/NavBar";
import Sidebar from "@/components/wiki/Sidebar";
import { Version } from "@/lib/db";
import { useState } from "react";

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
  versions,
  counts,
  totalRels,
  children,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-background text-text-primary">
      <NavBar
        totalChars={totalChars}
        totalPlayers={totalPlayers}
        totalVersions={totalVersions}
        onMenuToggle={() => setMenuOpen((o) => !o)}
        menuOpen={menuOpen}
      />
      <div className="flex flex-1">
        <Sidebar
          versions={versions}
          counts={counts}
          totalChars={totalChars}
          totalPlayers={totalPlayers}
          totalRels={totalRels}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </main>
  );
}
