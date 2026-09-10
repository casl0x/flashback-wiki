"use client";

import { PlayerBadges } from "@/components/admin/PlayerBadges";
import { Circle, Radio, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const REFRESH_INTERVAL_MS = 60_000;

type WikiPlayer = {
  id: string;
  pseudo: string;
  lienChaine: string | null;
  badges: string[];
};

type TwitchLiveStatus = {
  username: string;
  isLive: boolean;
  viewerCount: number;
  gameName: string | null;
  thumbnailUrl: string | null;
};

function extractTwitchUsername(url: string | null) {
  if (!url) return null;
  const username = url.split("twitch.tv/")[1]?.split("/")[0]?.split("?")[0];
  return username?.trim().toLowerCase() || null;
}

export default function JoueursPage() {
  const [players, setPlayers] = useState<WikiPlayer[]>([]);
  const [liveStatus, setLiveStatus] = useState<Map<string, TwitchLiveStatus>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/data", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setPlayers(data.players ?? []))
      .finally(() => setLoading(false));
  }, []);

  const refreshLiveStatus = useCallback(() => {
    fetch("/api/twitch-live", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: TwitchLiveStatus[] | { error: string }) => {
        if (!Array.isArray(data)) {
          setLiveError(data.error ?? "Erreur inconnue");
          return;
        }
        setLiveError(null);
        setLiveStatus(new Map(data.map((s) => [s.username, s])));
      })
      .catch(() => setLiveError("Impossible de contacter le serveur"));
  }, []);

  useEffect(() => {
    refreshLiveStatus();
    const interval = setInterval(refreshLiveStatus, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshLiveStatus]);

  const streamers = players
    .filter((p) => p.badges?.includes("streamer"))
    .map((p) => ({ player: p, username: extractTwitchUsername(p.lienChaine) }))
    .filter(
      (entry): entry is { player: WikiPlayer; username: string } =>
        !!entry.username,
    )
    .map(({ player, username }) => ({
      player,
      username,
      status: liveStatus.get(username) ?? null,
    }))
    .sort((a, b) => {
      const liveDiff = Number(!!b.status?.isLive) - Number(!!a.status?.isLive);
      if (liveDiff !== 0) return liveDiff;
      return a.player.pseudo.localeCompare(b.player.pseudo);
    });

  const liveCount = streamers.filter((s) => s.status?.isLive).length;

  return (
    <main>
      <section className="px-4 lg:px-5">
        <div className="p-5 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-medium">Joueurs</p>
              <p className="text-xs text-muted-foreground">
                {streamers.length} streamer{streamers.length > 1 ? "s" : ""}
                {liveCount > 0 && (
                  <span className="text-red-400">
                    {" "}
                    · {liveCount} en live
                  </span>
                )}
              </p>
            </div>
          </div>

          {liveError && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-400">
              Statut Twitch indisponible ({liveError}) — les joueurs
              affichés ci-dessous peuvent ne pas refléter leur état réel.
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl border border-border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : streamers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-muted-foreground">
              <p className="text-sm">
                Aucun joueur avec une chaîne Twitch pour l&apos;instant.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {streamers.map(({ player, username, status }) => (
                <StreamerCard
                  key={player.id}
                  player={player}
                  username={username}
                  status={status}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StreamerCard({
  player,
  username,
  status,
}: {
  player: WikiPlayer;
  username: string;
  status: TwitchLiveStatus | null;
}) {
  const isLive = !!status?.isLive;
  const playerName = player.pseudo.trim() || "Joueur";

  return (
    <a
      href={`https://twitch.tv/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors ${
        isLive
          ? "border-red-500/40 hover:border-red-500/70"
          : "border-border hover:border-border-mid"
      }`}
    >
      {isLive && status?.thumbnailUrl ? (
        <div className="relative aspect-video w-full overflow-hidden bg-elevated">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={status.thumbnailUrl}
            alt={`Stream de ${playerName}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Radio className="h-2.5 w-2.5" />
            LIVE
          </span>
          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
            {status.viewerCount.toLocaleString("fr-FR")} viewers
          </span>
        </div>
      ) : null}

      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold bg-elevated border border-border text-text-secondary shrink-0">
          {playerName.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display font-bold text-[14px] text-text-primary tracking-wide truncate">
              {playerName}
            </p>
          </div>
          <p className="text-[11px] text-text-muted truncate">
            @{username}
          </p>
          {player.badges?.length > 0 && (
            <div className="mt-1">
              <PlayerBadges badges={player.badges} size="sm" />
            </div>
          )}
        </div>

        {isLive ? (
          <span className="relative flex items-center gap-1 shrink-0 rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-400">
            <span className="absolute -left-0.5 -top-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            </span>
            <Circle className="h-2 w-2 fill-red-400 text-red-400" />
            LIVE
            {status && status.viewerCount > 0 && (
              <span className="text-red-400/80">
                · {status.viewerCount.toLocaleString("fr-FR")}
              </span>
            )}
          </span>
        ) : (
          <span className="flex items-center gap-1 shrink-0 rounded-full bg-elevated px-2 py-1 text-[10px] font-medium text-text-faint">
            <Circle className="h-2 w-2 fill-text-faint text-text-faint" />
            Offline
          </span>
        )}
      </div>

      {isLive && status?.gameName && (
        <p className="px-4 pb-3 -mt-1 text-[11px] text-text-muted truncate">
          {status.gameName}
        </p>
      )}
    </a>
  );
}
