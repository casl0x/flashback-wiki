"use client";

import WikiLayout from "@/components/wiki/WikiLayout";
import { Version } from "@/lib/db";
import { useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ChangelogEntry = {
  id: string;
  type: string;
  label: string;
  detail: string | null;
  createdAt: string;
};

type WikiLayoutProps = {
  totalChars: number;
  totalPlayers: number;
  totalVersions: number;
  versions: Version[];
  counts: Record<string, number>;
  totalRels: number;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

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
} as const;

const BADGE_CLASS: Record<string, string> = {
  add: "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]",
  edit: "bg-[#E6F1FB] text-[#185FA5] border-[#B5D4F4]",
  version: "bg-[#EEEDFE] text-[#3C3489] border-[#CECBF6]",
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [wikiData, setWikiData] = useState<WikiLayoutProps>({
    totalChars: 0,
    totalPlayers: 0,
    totalVersions: 0,
    versions: [],
    counts: {},
    totalRels: 0,
  });

  useEffect(() => {
    fetch("/api/data", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const characters = d.characters ?? [];
        setWikiData({
          totalChars: characters.length,
          totalPlayers: (d.players ?? []).length,
          totalVersions: (d.versions ?? []).length,
          versions: (d.versions ?? []) as Version[],
          counts: (d.counts ?? {}) as Record<string, number>,
          totalRels: characters.reduce(
            (acc: number, c: { relations?: unknown[] }) =>
              acc + (c.relations?.length ?? 0),
            0,
          ),
        });
      });
  }, []);

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => r.json())
      .then((d) => {
        setEntries(d);
        setLoading(false);
      });
  }, []);

  return (
    <WikiLayout {...wikiData}>
      <section className="space-y-4 p-4 lg:p-5">
        {/* Header */}
        <div className="rounded-xl border border-border bg-card p-5 lg:p-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-text-faint mb-1">
            Wiki
          </p>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Changelog
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Historique des dernières modifications du wiki
          </p>
        </div>

        {/* Liste */}
        <div className="rounded-xl border border-border bg-card p-5 lg:p-8">
          {loading ? (
            <div className="flex flex-col gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center pt-1.5 gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-elevated animate-pulse" />
                    {i < 5 && (
                      <div className="w-px h-10 bg-elevated animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 pb-2 flex flex-col gap-1.5">
                    <div className="flex gap-2 items-center">
                      <div className="h-5 w-14 rounded bg-elevated animate-pulse" />
                      <div className="h-5 w-16 rounded bg-elevated animate-pulse" />
                      <div className="h-5 w-28 rounded bg-elevated animate-pulse" />
                    </div>
                    <div className="h-3 w-24 rounded bg-elevated animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">
              Aucune entrée pour l&apos;instant.
            </p>
          ) : (
            <div className="flex flex-col">
              {entries.map((e, i) => {
                const t =
                  TYPES[e.type as keyof typeof TYPES] ?? TYPES.edit_info;
                return (
                  <div key={e.id} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center pt-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: t.color }}
                      />
                      {i < entries.length - 1 && (
                        <div className="w-px flex-1 bg-border min-h-6 mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-5">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded border font-medium ${BADGE_CLASS[t.cat]}`}
                        >
                          {t.label}
                        </span>
                        {t.sub && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-elevated text-text-secondary border border-border">
                            {t.sub}
                          </span>
                        )}
                        <span className="text-[14px] font-medium text-text-primary">
                          {e.label}
                        </span>
                      </div>
                      {e.detail && (
                        <p className="text-[13px] text-text-secondary mt-0.5">
                          {e.detail}
                        </p>
                      )}
                      <p className="text-[11px] text-text-faint mt-1">
                        {new Date(e.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </WikiLayout>
  );
}
