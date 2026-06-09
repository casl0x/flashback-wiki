"use client";

import { BadgePill } from "@/components/user/badges";
import WikiLayout from "@/components/wiki/WikiLayout";
import { Version } from "@/lib/db";
import { useUser } from "@clerk/nextjs";
import { Trophy, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type MeData = {
  pseudo: string;
  avatarUrl: string | null;
  points: number;
  badges: string[];
  stats: {
    pending: number;
    accepted: number;
    rejected: number;
  };
};

type WikiLayoutProps = {
  totalChars: number;
  totalPlayers: number;
  totalVersions: number;
  versions: Version[];
  counts: Record<string, number>;
  totalRels: number;
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { isLoaded, isSignedIn } = useUser();
  const [data, setData] = useState<MeData | null>(null);
  const [wikiData, setWikiData] = useState<WikiLayoutProps>({
    totalChars: 0,
    totalPlayers: 0,
    totalVersions: 0,
    versions: [],
    counts: {},
    totalRels: 0,
  });
  const [fetched, setFetched] = useState(false);

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
              acc + (c.relations?.length || 0),
            0,
          ),
        });
      });
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setFetched(true);
      });
  }, [isLoaded, isSignedIn]);

  const loading = isLoaded && isSignedIn && !fetched;

  const totalSuggestions = data
    ? data.stats.pending + data.stats.accepted + data.stats.rejected
    : 0;

  return (
    <WikiLayout {...wikiData}>
      <section className="space-y-4 p-4 lg:p-5">
        {/* Header profil */}
        <div className="space-y-5 rounded-xl border border-border bg-card p-5 lg:p-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted overflow-hidden">
              {!loading && data?.avatarUrl ? (
                <Image
                  src={data.avatarUrl}
                  width={44}
                  height={44}
                  alt={data.pseudo}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              {loading ? (
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-32 rounded bg-elevated animate-pulse" />
                  <div className="h-3 w-20 rounded bg-elevated animate-pulse" />
                </div>
              ) : !isSignedIn ? (
                <>
                  <p className="text-lg font-medium">Mon profil</p>
                  <p className="text-sm text-muted-foreground">
                    Connecte-toi pour voir tes stats
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">{data?.pseudo}</p>
                  <p className="text-sm text-muted-foreground">
                    {data?.points ?? 0} points
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Badges */}
          {!loading && isSignedIn && (
            <div className="border-t border-border pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                Badges
              </p>
              {data?.badges.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.badges.map((b) => (
                    <BadgePill key={b} badgeKey={b} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun badge pour l&apos;instant, peut-être qu&apos;ils
                  arriveront plus tard...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stats contributions */}
        {!loading && isSignedIn && (
          <div className="space-y-5 rounded-xl border border-border bg-card p-5 lg:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-medium">Contributions</p>
                <p className="text-xs text-muted-foreground">
                  Tes propositions de modifications
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-border pt-5">
              {[
                {
                  label: "Total",
                  value: totalSuggestions,
                  color: "text-text-primary",
                },
                {
                  label: "Acceptées",
                  value: data?.stats.accepted ?? 0,
                  color: "text-accent-light",
                },
                {
                  label: "En attente",
                  value: data?.stats.pending ?? 0,
                  color: "text-amber-400",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-muted p-4"
                >
                  <span className={`text-[22px] font-bold ${color}`}>
                    {value}
                  </span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            {(data?.stats.rejected ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                {data!.stats.rejected} proposition
                {data!.stats.rejected > 1 ? "s" : ""} refusée
                {data!.stats.rejected > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </section>
    </WikiLayout>
  );
}
