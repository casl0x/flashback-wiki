"use client";

import { Button, Empty, Notice, Panel, Select, TextInput } from "@/app/_composents/admin/ui";
import type { AdminClip } from "@/app/api/admin/clips/route";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type Channel = { login: string; player: string };

const PERIODS = [
  { label: "7 jours", days: 7 },
  { label: "30 jours", days: 30 },
  { label: "90 jours", days: 90 },
  { label: "1 an", days: 365 },
  { label: "Tout", days: 0 },
] as const;

const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export default function ClipsBrowser({ channels }: { channels: Channel[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [chanQ, setChanQ] = useState("");
  const [days, setDays] = useState<number>(30); // -1 = dates personnalisées
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unknown, setUnknown] = useState<string[]>([]);
  const [clips, setClips] = useState<AdminClip[] | null>(null);

  // Filtres appliqués localement sur les clips déjà chargés.
  const [q, setQ] = useState("");
  const [minViews, setMinViews] = useState("");
  const [maxDur, setMaxDur] = useState("");
  const [game, setGame] = useState("");
  const [creator, setCreator] = useState("");
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [sort, setSort] = useState<"views" | "recent" | "old" | "dur">("views");
  const [playing, setPlaying] = useState<string | null>(null);

  const shownChannels = useMemo(() => {
    const n = chanQ.trim().toLowerCase();
    return channels.filter((c) => !n || c.login.includes(n) || c.player.toLowerCase().includes(n));
  }, [channels, chanQ]);

  const toggle = (login: string) =>
    setSelected((s) => (s.includes(login) ? s.filter((l) => l !== login) : [...s, login]));

  async function search() {
    setLoading(true);
    setError(null);
    setPlaying(null);
    try {
      const p = new URLSearchParams({ logins: selected.join(","), pages: String(pages) });
      if (days > 0) p.set("from", new Date(Date.now() - days * 864e5).toISOString());
      if (days === -1) {
        // Bornes en heure locale ; "au" inclut toute la journée choisie.
        if (dateFrom) p.set("from", new Date(`${dateFrom}T00:00:00`).toISOString());
        if (dateTo) p.set("to", new Date(`${dateTo}T23:59:59.999`).toISOString());
      }
      const res = await fetch(`/api/admin/clips?${p}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
      setClips(json.clips);
      setUnknown(json.unknown ?? []);
      setGame("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const games = useMemo(
    () => [...new Set((clips ?? []).map((c) => c.game).filter((g): g is string => !!g))].sort(),
    [clips],
  );

  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    const cr = creator.trim().toLowerCase();
    const mv = Number(minViews) || 0;
    const md = Number(maxDur) || 0;
    const fromMs = fromDay ? new Date(`${fromDay}T00:00:00`).getTime() : -Infinity;
    const toMs = toDay ? new Date(`${toDay}T23:59:59.999`).getTime() : Infinity;
    const list = (clips ?? []).filter(
      (c) =>
        (!n || c.title.toLowerCase().includes(n)) &&
        (!cr || c.creator_name.toLowerCase().includes(cr)) &&
        c.view_count >= mv &&
        new Date(c.created_at).getTime() >= fromMs &&
        new Date(c.created_at).getTime() <= toMs &&
        (!md || c.duration <= md) &&
        (!game || c.game === game),
    );
    const by = {
      views: (a: AdminClip, b: AdminClip) => b.view_count - a.view_count,
      recent: (a: AdminClip, b: AdminClip) => b.created_at.localeCompare(a.created_at),
      old: (a: AdminClip, b: AdminClip) => a.created_at.localeCompare(b.created_at),
      dur: (a: AdminClip, b: AdminClip) => b.duration - a.duration,
    }[sort];
    return list.sort(by);
  }, [clips, q, creator, minViews, maxDur, game, sort, fromDay, toDay]);

  return (
    <div className="flex flex-col gap-5">
      <Panel legend="1 · Chaînes">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              placeholder="Filtrer joueur / chaîne…"
              value={chanQ}
              onChange={(e) => setChanQ(e.target.value)}
              className="max-w-xs"
            />
            <Button type="button" onClick={() => setSelected(shownChannels.map((c) => c.login).slice(0, 25))}>
              Tout sélectionner (max 25)
            </Button>
            <Button type="button" onClick={() => setSelected([])}>
              Vider
            </Button>
            <span className="text-[12px] text-[#9AA0AA]">{selected.length} sélectionnée(s)</span>
          </div>
          <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
            {shownChannels.length === 0 && <Empty>Aucune chaîne Twitch.</Empty>}
            {shownChannels.map((c) => {
              const on = selected.includes(c.login);
              return (
                <button
                  key={c.login}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c.login)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[13px] font-semibold",
                    on
                      ? "border-[#9146FF] bg-[#9146FF]/20 text-white"
                      : "border-[#3A3E47] text-[#C4C7CF] hover:border-[#9146FF]",
                  )}
                >
                  {c.player}
                  {c.player.toLowerCase() !== c.login && <span className="text-[#9AA0AA]"> · {c.login}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      <Panel legend="2 · Période">
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setDays(p.days)}
              aria-pressed={days === p.days}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[13px] font-semibold",
                days === p.days ? "border-[#2F6FEB] bg-[#1F2A44] text-white" : "border-[#3A3E47] text-[#C4C7CF]",
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDays(-1)}
            aria-pressed={days === -1}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-[13px] font-semibold",
              days === -1 ? "border-[#2F6FEB] bg-[#1F2A44] text-white" : "border-[#3A3E47] text-[#C4C7CF]",
            )}
          >
            Dates précises
          </button>
          {days === -1 && (
            <>
              <label className="flex items-center gap-1.5 text-[13px] text-[#A3A8B3]">
                Du
                <TextInput type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} className="w-auto" />
              </label>
              <label className="flex items-center gap-1.5 text-[13px] text-[#A3A8B3]">
                au
                <TextInput type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className="w-auto" />
              </label>
            </>
          )}
          <label className="ml-2 flex items-center gap-2 text-[13px] text-[#A3A8B3]">
            Profondeur
            <Select value={pages} onChange={(e) => setPages(Number(e.target.value))} className="w-auto">
              {[1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>
                  {n * 100} clips / chaîne
                </option>
              ))}
            </Select>
          </label>
          <Button type="button" variant="primary" disabled={loading || selected.length === 0} onClick={search}>
            {loading ? "Recherche…" : "Chercher les clips"}
          </Button>
        </div>
        <p className="m-0 mt-2 text-[12px] text-[#9AA0AA]">
          Twitch renvoie les clips les plus vus de la période, par chaîne.
        </p>
      </Panel>

      {error && <Notice tone="error">{error}</Notice>}
      {unknown.length > 0 && <Notice tone="error">Chaînes introuvables : {unknown.join(", ")}</Notice>}

      {clips && (
        <Panel legend={`3 · Résultats (${results.length} / ${clips.length})`}>
          <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2">
            <TextInput placeholder="Mot dans le titre" value={q} onChange={(e) => setQ(e.target.value)} />
            <TextInput placeholder="Clippeur" value={creator} onChange={(e) => setCreator(e.target.value)} />
            <TextInput
              type="number"
              min={0}
              placeholder="Vues min."
              value={minViews}
              onChange={(e) => setMinViews(e.target.value)}
            />
            <TextInput
              type="number"
              min={0}
              placeholder="Durée max (s)"
              value={maxDur}
              onChange={(e) => setMaxDur(e.target.value)}
            />
            <label className="flex items-center gap-1.5 text-[13px] text-[#A3A8B3]">
              Du
              <TextInput type="date" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
            </label>
            <label className="flex items-center gap-1.5 text-[13px] text-[#A3A8B3]">
              au
              <TextInput type="date" value={toDay} onChange={(e) => setToDay(e.target.value)} />
            </label>
            <Select value={game} onChange={(e) => setGame(e.target.value)}>
              <option value="">Tous les jeux</option>
              {games.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="views">Plus vus</option>
              <option value="recent">Plus récents</option>
              <option value="old">Plus anciens</option>
              <option value="dur">Plus longs</option>
            </Select>
          </div>

          {results.length === 0 ? (
            <Empty>Aucun clip ne correspond.</Empty>
          ) : (
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-0">
              {results.slice(0, 120).map((c) => (
                <li key={c.id} className="flex flex-col overflow-hidden rounded-[10px] border border-[#23262D] bg-[#0F1013]">
                  {playing === c.id ? (
                    <iframe
                      title={c.title}
                      src={`https://clips.twitch.tv/embed?clip=${c.id}&parent=${window.location.hostname}&autoplay=true`}
                      allowFullScreen
                      className="aspect-video w-full border-0"
                    />
                  ) : (
                    <button type="button" onClick={() => setPlaying(c.id)} className="relative block" aria-label={`Lire ${c.title}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.thumbnail_url} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 text-[12px] font-bold">
                        {fmtDur(c.duration)}
                      </span>
                    </button>
                  )}
                  <div className="flex flex-col gap-0.5 p-3">
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="line-clamp-2 font-semibold hover:underline">
                      {c.title}
                    </a>
                    <span className="text-[12px] text-[#9AA0AA]">
                      <strong className="text-[#B28BFF]">{c.broadcaster_name}</strong> · {c.view_count.toLocaleString("fr-FR")} vues
                    </span>
                    <span className="text-[12px] text-[#9AA0AA]">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")} · par {c.creator_name}
                      {c.game && ` · ${c.game}`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {results.length > 120 && (
            <p className="m-0 mt-3 text-[12px] text-[#9AA0AA]">120 premiers affichés — affine les filtres.</p>
          )}
        </Panel>
      )}
    </div>
  );
}
