"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Entry = { id: string; label: string; detail: string | null; createdAt: string };

const SEEN_KEY = "news-last-seen";

function readSeen(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NewsButton() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeen(readSeen());
    fetch("/api/changelog?type=site", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Entry[]) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => setEntries([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const newest = entries?.[0] ? new Date(entries[0].createdAt).getTime() : 0;
  const hasNew = newest > seen;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && newest) {
      try {
        localStorage.setItem(SEEN_KEY, String(newest));
      } catch {}
      setSeen(newest);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Nouveautés du site"
        aria-expanded={open}
        className="relative flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
      >
        <Sparkles className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Nouveautés</span>
        {hasNew && (
          <span
            aria-hidden
            className="absolute right-1 top-1.5 h-2 w-2 rounded-full bg-[#2F6FEB]"
          />
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Nouveautés du site"
          className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-2xl"
        >
          <p className="m-0 pb-2 text-sm font-bold text-text-primary">Nouveautés</p>
          {entries === null ? (
            <p className="m-0 text-xs text-text-muted">Chargement…</p>
          ) : entries.length === 0 ? (
            <p className="m-0 text-xs text-text-muted">Aucune nouveauté pour le moment.</p>
          ) : (
            <ol className="m-0 flex max-h-96 list-none flex-col gap-3 overflow-y-auto p-0">
              {entries.map((e) => (
                <li key={e.id} className="flex flex-col gap-0.5 border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <span className="text-[11px] text-text-muted">{fmt(e.createdAt)}</span>
                  <strong className="text-sm text-text-primary">{e.label}</strong>
                  {e.detail && (
                    <span className="whitespace-pre-line text-xs text-text-secondary">
                      {e.detail}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
