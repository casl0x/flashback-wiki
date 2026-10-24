"use client";

import { getNotificationKind, toneStyle } from "@/lib/notification-kinds";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Item = { id: string; type: string; message: string; read: boolean; createdAt: string };

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

export default function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const load = useCallback(() => {
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [], unread: 0 }))
      .then((d: { items?: Item[]; unread?: number }) => {
        setItems(d.items ?? []);
        setUnread(d.unread ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Fermer au clic à l'extérieur ou avec Échap.
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

  async function markRead(ids?: string[]) {
    setItems((prev) =>
      ids
        ? prev.map((i) => (ids.includes(i.id) ? { ...i, read: true } : i))
        : prev.map((i) => ({ ...i, read: true })),
    );
    setUnread((prev) => (ids ? Math.max(0, prev - ids.length) : 0));
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { ids } : {}),
      });
    } catch {
      load();
    }
  }

  function handleItemClick(item: Item) {
    if (!item.read) markRead([item.id]);
    setOpen(false);
    const kind = getNotificationKind(item.type);
    if (kind.href) router.push(kind.href);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={
          unread > 0
            ? `Notifications, ${unread} non lue${unread > 1 ? "s" : ""}`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-[#23262D] bg-[#15171B] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[#23262D] px-4 py-3">
            <span className="text-sm font-semibold text-[#ECECEE]">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead()}
                className="text-[12px] font-semibold text-[#8AB4FF] hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#9AA0AA]">
              Aucune notification pour l’instant.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto" role="list">
              {items.map((n) => {
                const kind = getNotificationKind(n.type);
                const style = toneStyle(kind.tone);
                const Icon = kind.icon;
                return (
                  <li key={n.id} className="border-b border-[#23262D] last:border-b-0">
                    <button
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5",
                        !n.read && "bg-white/3",
                      )}
                    >
                      <Icon
                        className="mt-0.5 h-4 w-4 flex-none"
                        style={{ color: style.color }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] leading-snug text-[#ECECEE]">{n.message}</p>
                        <p className="mt-1 text-[11px] text-[#9AA0AA]">{ago(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <span
                          className="mt-1.5 h-2 w-2 flex-none rounded-full bg-[#2F6FEB]"
                          aria-label="non lu"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/profil#notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-[#23262D] px-4 py-2.5 text-center text-[12px] font-semibold text-[#8AB4FF] hover:underline"
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}
