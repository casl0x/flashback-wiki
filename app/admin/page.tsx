"use client";

import { CharactersTab } from "@/components/admin/CharactersTab";
import { PlayersTab } from "@/components/admin/PlayersTab";
import { VersionsTab } from "@/components/admin/VersionsTab";
import { Player, Version } from "@/lib/db";
import { useEffect, useState } from "react";

type Tab = "characters" | "players" | "versions";

const TABS: { id: Tab; label: string }[] = [
  { id: "characters", label: "Personnages" },
  { id: "players", label: "Joueurs" },
  { id: "versions", label: "Versions" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("characters");
  const [players, setPlayers] = useState<Player[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setPlayers(d.players ?? []);
        setVersions(d.versions ?? []);
      });
  }, []);

  if (typeof window === "undefined") return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-sm">
            ⚡
          </div>
          <span className="font-display font-bold text-[16px] tracking-widest text-text-primary">
            FLASH<span className="text-accent-light">BACK</span>
          </span>
          <span className="text-[10px] text-text-muted ml-1">Admin</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 text-[12px] font-medium py-1.5 rounded-md transition-colors cursor-pointer ${
                tab === t.id
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text-secondary hover:bg-elevated"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "characters" && (
          <CharactersTab players={players} versions={versions} />
        )}
        {tab === "players" && <PlayersTab />}
        {tab === "versions" && <VersionsTab />}
      </div>
    </div>
  );
}
