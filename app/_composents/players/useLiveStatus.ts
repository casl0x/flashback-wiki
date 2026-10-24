"use client";

import type { StreamPlatform } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

const REFRESH_INTERVAL_MS = 60_000;

export type LiveStatus = {
  username: string;
  isLive: boolean;
  viewerCount: number;
  gameName: string | null;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
};

/** Interroge /api/twitch-live et /api/kick-live, puis toutes les 60 s. */
export function useLiveStatus() {
  const [twitch, setTwitch] = useState<Map<string, LiveStatus>>(new Map());
  const [kick, setKick] = useState<Map<string, LiveStatus>>(new Map());

  const refresh = useCallback(() => {
    fetch("/api/twitch-live", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: LiveStatus[] | { error: string }) => {
        if (Array.isArray(data)) setTwitch(new Map(data.map((s) => [s.username, s])));
      })
      .catch(() => {});

    fetch("/api/kick-live", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: LiveStatus[] | { error: string }) => {
        if (Array.isArray(data)) setKick(new Map(data.map((s) => [s.username, s])));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return { twitch, kick };
}

export function liveStatusFor(
  platform: StreamPlatform | null,
  username: string | null,
  twitch: Map<string, LiveStatus>,
  kick: Map<string, LiveStatus>,
): LiveStatus | null {
  if (!platform || !username) return null;
  return (platform === "twitch" ? twitch : kick).get(username) ?? null;
}
