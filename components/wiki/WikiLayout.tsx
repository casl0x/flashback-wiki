"use client";

import Header from "@/app/_composents/ui/Header";
import { Version } from "@/lib/db";

// Pages où la barre de recherche du header n'a aucun effet
const SEARCH_HIDDEN_ROUTES = ["/", "/musiques"];

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
export default function WikiLayout({ children }: Props) {
  return (
    <body>
      <Header />
      <main className="flex min-h-screen flex-col bg-background text-text-primary">
        {children}
      </main>
    </body>
  );
}
