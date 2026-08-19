"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { PollAdmin } from "@/components/admin/PollAdmin";
import { ChangelogTab } from "@/components/admin/ChangelogTab";

type Stat = { label: string; value: number; href: string; color: string };
type ChangelogEntry = {
  id: string;
  type: string;
  label: string;
  detail: string | null;
  createdAt: string;
};

const TYPES = {
  add_global: { label: "Ajout", sub: "Global", cat: "add", color: "#639922" },
  add_relation: {
    label: "Ajout",
    sub: "Relation",
    cat: "add",
    color: "#639922",
  },
  add_lieu: {
    label: "Ajout",
    sub: "Lieu de vie",
    cat: "add",
    color: "#639922",
  },
  edit_info: { label: "Modif", sub: "Infos", cat: "edit", color: "#185FA5" },
  edit_relation: {
    label: "Modif",
    sub: "Relations",
    cat: "edit",
    color: "#185FA5",
  },
  edit_lieu: {
    label: "Modif",
    sub: "Lieu de vie",
    cat: "edit",
    color: "#185FA5",
  },
  version: { label: "Version", sub: "", cat: "version", color: "#534AB7" },
  site: { label: "Site", sub: "", cat: "site", color: "#B85FA5" },
} as const;

const BADGE_CLASS: Record<string, string> = {
  add: "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]",
  edit: "bg-[#E6F1FB] text-[#185FA5] border-[#B5D4F4]",
  version: "bg-[#EEEDFE] text-[#3C3489] border-[#CECBF6]",
  site: "bg-[#FBEAF0] text-[#993356] border-[#F4C0D1]",
};

export function DashboardClient({
  stats,
  recentChangelog,
}: {
  stats: {
    totalChars: number;
    totalPlayers: number;
    totalVersions: number;
    totalRels: number;
    totalSuggestions: number;
  };
  recentChangelog: ChangelogEntry[];
}) {
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>(recentChangelog);

  const STATS: Stat[] = [
    {
      label: "Personnages",
      value: stats.totalChars,
      href: "/admin/characters",
      color: "text-accent-light",
    },
    {
      label: "Joueurs",
      value: stats.totalPlayers,
      href: "/admin/players",
      color: "text-accent-light",
    },
    {
      label: "Versions",
      value: stats.totalVersions,
      href: "/admin/versions",
      color: "text-accent-light",
    },
    {
      label: "Relations",
      value: stats.totalRels,
      href: "/admin/characters",
      color: "text-accent-light",
    },
    {
      label: "Suggestions",
      value: stats.totalSuggestions,
      href: "/admin/suggestions",
      color: "text-amber-400",
    },
  ];

  async function submit() {
    if (!label) return;
    setLoading(true);
    const res = await fetch("/api/changelog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, detail: detail || null }),
    });
    const newEntry = await res.json();
    setEntries((prev) => [newEntry, ...prev.slice(0, 4)]);
    setLabel("");
    setDetail("");
    setLoading(false);
  }

  return (
    <div className="p-5 lg:p-7 flex flex-col gap-5 mx-10">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">
          Admin
        </p>
        <h1 className="text-xl font-bold text-text-primary tracking-wide">
          Tableau de bord
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {STATS.map(({ label, value, href, color }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 hover:border-border-mid transition-colors"
          >
            <span className={`text-[26px] font-bold ${color}`}>{value}</span>
            <span className="text-[11px] text-text-muted">{label}</span>
          </Link>
        ))}
      </div>

      {/* Changelog */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold text-text-primary tracking-wide">
            Publier une mise à jour site
          </h2>
          <Link
            href="/changelog"
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Voir tout →
          </Link>
        </div>

        {/* Formulaire */}
        <ChangelogTab />
      </div>
      <PollAdmin />
    </div>
  );
}
