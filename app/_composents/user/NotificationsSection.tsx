"use client";

import { anton } from "@/lib/fonts";
import { getNotificationKind, toneStyle } from "@/lib/notification-kinds";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Item = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};
type Filter = "all" | "unread";

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
function ago(iso: string) {
  const s = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const a = Math.abs(s);
  if (a < 60) return "à l’instant";
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (a < 2 * 86400) return "hier";
  return rtf.format(Math.round(s / 86400), "day");
}

/** Historique complet des notifications, paginé, avec filtre et « tout marquer comme lu ». */
export function NotificationsSection() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    (params: URLSearchParams) =>
      fetch(`/api/notifications?${params}`, { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : { items: [], nextCursor: null },
      ) as Promise<{ items?: Item[]; nextCursor?: string | null }>,
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter === "unread") params.set("unread", "1");
    fetchPage(params).then((d) => {
      setItems(d.items ?? []);
      setCursor(d.nextCursor ?? null);
      setReady(true);
    });
  }, [filter, fetchPage]);

  function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    const params = new URLSearchParams({ cursor });
    if (filter === "unread") params.set("unread", "1");
    fetchPage(params)
      .then((d) => {
        setItems((prev) => [...prev, ...(d.items ?? [])]);
        setCursor(d.nextCursor ?? null);
      })
      .finally(() => setLoadingMore(false));
  }

  async function markAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } finally {
      if (filter === "unread") setItems([]);
    }
  }

  async function markOneRead(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, read: true } : i)),
    );
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  }

  const hasUnread = items.some((i) => !i.read);

  return (
    <section
      id="notifications"
      aria-labelledby="notifications-h"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="notifications-h"
          className={cn(
            anton.className,
            "m-0 text-[26px] uppercase tracking-[0.02em] sm:text-[30px]",
          )}
        >
          Notifications
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-[#3A3E47] p-0.5">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded px-3 py-1 text-[12px] font-semibold",
                  filter === f ? "bg-[#2F6FEB] text-white" : "text-[#9AA0AA]",
                )}
              >
                {f === "all" ? "Toutes" : "Non lues"}
              </button>
            ))}
          </div>
          {hasUnread && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[12px] font-semibold text-[#8AB4FF] hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {!ready ? (
        <p className="text-[13px] text-[#9AA0AA]">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-[13px] text-[#9AA0AA]">
          {filter === "unread"
            ? "Aucune notification non lue."
            : "Aucune notification."}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((n) => {
            const kind = getNotificationKind(n.type);
            const style = toneStyle(kind.tone);
            const Icon = kind.icon;
            const content = (
              <div className="flex items-start gap-3 rounded-[10px] border border-[#23262D] bg-[#15171B] px-4 py-3">
                <Icon
                  className="mt-0.5 h-4 w-4 flex-none"
                  style={{ color: style.color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-[#ECECEE]">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[11px] text-[#9AA0AA]">
                    {ago(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <span
                    className="mt-1.5 h-2 w-2 flex-none rounded-full bg-[#2F6FEB]"
                    aria-label="non lu"
                  />
                )}
              </div>
            );
            return (
              <li key={n.id}>
                {kind.href ? (
                  <Link
                    href={kind.href}
                    onClick={() => !n.read && markOneRead(n.id)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => !n.read && markOneRead(n.id)}
                    className="block w-full text-left"
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {cursor && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="self-start text-[13px] font-semibold text-[#8AB4FF] hover:underline disabled:opacity-50"
        >
          {loadingMore ? "…" : "Voir plus"}
        </button>
      )}
    </section>
  );
}
