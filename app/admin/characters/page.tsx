"use client";

import { CharactersTab } from "@/components/admin/CharactersTab";
import { Groupe, Player, Version } from "@/lib/db";
import { useEffect, useState } from "react";

export default function CharactersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/data", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setPlayers(d.players ?? []);
        setVersions(d.versions ?? []);
        setGroupes(d.groupes ?? []);
        setLoaded(true);
      });
  }, []);

  return (
    <>
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-text-primary flex items-center gap-2">
            <svg
              className="text-accent"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Personnages
          </h1>
          <p className="text-[11px] text-text-muted mt-0.5">
            Gérer les personnages du jeu
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loaded ? (
          <CharactersTab
            players={players}
            versions={versions}
            groupes={groupes}
          />
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <svg
                className="animate-spin"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span className="text-[12px]">Chargement…</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
