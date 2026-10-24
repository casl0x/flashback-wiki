"use client";

import { KickIcon, TwitchIcon } from "@/app/_composents/icons/PlatformIcons";
import { useSearch } from "@/app/_composents/SearchContext";
import { initials } from "@/lib/cloudinary";
import { anton } from "@/lib/fonts";
import type { PlayerListItem } from "@/lib/player-page";
import { cn, matchesSearch, type StreamPlatform } from "@/lib/utils";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import LiveSection, { type LivePlayer } from "./LiveSection";
import { liveStatusFor, useLiveStatus } from "./useLiveStatus";

type PlatformFilter = "all" | StreamPlatform;
type SortOrder = "az" | "persos";

const PLATFORM_RING = { twitch: "#9146FF", kick: "#53FC18" } as const;

export default function PlayersPageClient({
  players,
}: {
  players: PlayerListItem[];
}) {
  const ctx = useSearch();
  const [localQuery, setLocalQuery] = useState("");
  const query = ctx?.query ?? localQuery;
  const setQuery = ctx?.setQuery ?? setLocalQuery;

  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [liveOnly, setLiveOnly] = useState(false);
  const [sort, setSort] = useState<SortOrder>("az");
  const [showFilters, setShowFilters] = useState(false);

  const { twitch, kick } = useLiveStatus();

  const lives: LivePlayer[] = useMemo(
    () =>
      players
        .filter(
          (p) => p.badges.includes("streamer") && p.platform && p.username,
        )
        .map((player) => ({
          player,
          status: liveStatusFor(player.platform, player.username, twitch, kick),
        }))
        .filter((e): e is LivePlayer => !!e.status?.isLive),
    [players, twitch, kick],
  );

  const streamerCount = players.filter(
    (p) => p.badges.includes("streamer") && p.platform,
  ).length;
  const liveIds = useMemo(
    () => new Set(lives.map((l) => l.player.id)),
    [lives],
  );

  const activeFilterCount = [platformFilter !== "all", liveOnly].filter(
    Boolean,
  ).length;

  const filtered = useMemo(() => {
    const result = players.filter((p) => {
      if (!p.badges.includes("streamer") || !p.platform) return false;
      const matchSearch = matchesSearch(p.pseudo, query);
      const matchPlatform =
        platformFilter === "all" || p.platform === platformFilter;
      const matchLive = !liveOnly || liveIds.has(p.id);
      return matchSearch && matchPlatform && matchLive;
    });
    result.sort((a, b) =>
      sort === "az"
        ? a.pseudo.localeCompare(b.pseudo, "fr")
        : b.characterCount - a.characterCount ||
          a.pseudo.localeCompare(b.pseudo, "fr"),
    );
    return result;
  }, [players, query, platformFilter, liveOnly, sort, liveIds]);

  const resetFilters = () => {
    setPlatformFilter("all");
    setLiveOnly(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1
          className={cn(
            anton.className,
            "m-0 text-[clamp(48px,10vw,80px)] uppercase leading-[0.95] text-[#ECECEE]",
          )}
        >
          Joueurs
        </h1>
        <p className="mt-2 text-[15px] text-[#A3A8B3]">
          {streamerCount} streamer{streamerCount > 1 ? "s" : ""}
          {lives.length > 0 && (
            <span className="text-[#FF8A8E]">
              {" "}
              · <span aria-hidden>●</span> {lives.length} en live maintenant
            </span>
          )}
        </p>
      </header>

      <LiveSection lives={lives} />

      <section aria-labelledby="tous-h" className="flex flex-col gap-4">
        <h2
          id="tous-h"
          className={cn(
            anton.className,
            "m-0 text-[22px] font-normal uppercase tracking-[0.02em] text-[#ECECEE] sm:text-[26px]",
          )}
        >
          Tous les streamers
        </h2>

        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-55 flex-1">
            <span className="sr-only">Rechercher un joueur par pseudo</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un pseudo…"
              className="h-11 w-full rounded-lg border border-[#23262D] bg-[#15171B] px-3.5 text-[14px] text-[#ECECEE] placeholder:text-[#6E7380] focus:border-[#3A3E47] focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3.5 text-[14px] font-semibold",
              activeFilterCount > 0
                ? "border-[#ECECEE] text-[#ECECEE]"
                : "border-[#23262D] text-[#C4C7CF] hover:border-[#3A3E47]",
            )}
          >
            Filtres
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ECECEE] px-1 text-[11px] font-bold text-[#0E0F12]">
                {activeFilterCount}
              </span>
            )}
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            aria-label="Trier les joueurs"
            className="h-11 rounded-lg border border-[#23262D] bg-[#15171B] px-3 text-[14px] text-[#ECECEE] focus:border-[#3A3E47] focus:outline-none"
          >
            <option value="az">A → Z</option>
            <option value="persos">Nombre de persos</option>
          </select>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 rounded-[10px] border border-[#23262D] bg-[#15171B] p-3.5">
            {(["twitch", "kick"] as const).map((p) => {
              const selected = platformFilter === p;
              const Icon = p === "kick" ? KickIcon : TwitchIcon;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatformFilter(selected ? "all" : p)}
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold capitalize",
                    selected
                      ? "border-transparent text-[#0E0F12]"
                      : "border-[#3A3E47] text-[#C4C7CF] hover:border-[#6E7380]",
                  )}
                  style={
                    selected ? { background: PLATFORM_RING[p] } : undefined
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setLiveOnly((v) => !v)}
              aria-pressed={liveOnly}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold",
                liveOnly
                  ? "border-[#E5484D] bg-[#2A1416] text-[#FF8A8E]"
                  : "border-[#3A3E47] text-[#C4C7CF] hover:border-[#6E7380]",
              )}
            >
              <span aria-hidden>●</span> En live
            </button>
          </div>
        )}

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            {platformFilter !== "all" && (
              <FilterChip
                label={platformFilter}
                onRemove={() => setPlatformFilter("all")}
              />
            )}
            {liveOnly && (
              <FilterChip label="En live" onRemove={() => setLiveOnly(false)} />
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="text-[#6E7380] underline-offset-2 hover:text-[#ECECEE] hover:underline"
            >
              Tout effacer
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="m-0 rounded-xl border border-dashed border-[#3A3E47] p-8 text-center text-[#9AA0AA]">
            {query
              ? `Aucun joueur ne correspond à "${query}".`
              : "Aucun joueur pour l’instant."}
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
            {filtered.map((p) => (
              <PlayerGridCard
                key={p.id}
                player={p}
                isLive={liveIds.has(p.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-[#3A3E47] bg-[#1A1D23] px-2.5 py-1 text-[#C4C7CF]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer le filtre ${label}`}
        className="text-[#6E7380] hover:text-[#ECECEE]"
      >
        ×
      </button>
    </span>
  );
}

function PlayerGridCard({
  player,
  isLive,
}: {
  player: PlayerListItem;
  isLive: boolean;
}) {
  const ringColor = player.platform
    ? PLATFORM_RING[player.platform]
    : "#3A3E47";
  const PlatformIcon = player.platform === "kick" ? KickIcon : TwitchIcon;

  return (
    <Link
      href={`/joueurs/${player.id}`}
      className="flex min-h-11 items-center gap-3 rounded-[10px] border border-[#23262D] bg-[#15171B] p-3.5 hover:border-[#3A3E47]"
    >
      <span
        aria-hidden
        className="relative flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#2B2E35] text-[14px] font-bold text-[#ECECEE] ring-2"
        style={{ "--tw-ring-color": ringColor } as CSSProperties}
      >
        {initials(player.pseudo)}
        {isLive && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#15171B] bg-[#E5484D]">
            <span className="sr-only">En live</span>
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] font-semibold text-[#ECECEE]">
          {player.pseudo}
        </span>
        <span className="text-[13px] text-[#9AA0AA]">
          {player.characterCount} perso{player.characterCount > 1 ? "s" : ""}
        </span>
      </span>
      {player.platform && (
        <PlatformIcon className="ml-auto h-4 w-4 flex-none" aria-hidden />
      )}
    </Link>
  );
}
