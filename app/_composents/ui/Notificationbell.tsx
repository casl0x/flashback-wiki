"use client";

import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCircle2,
  HelpCircle,
  Link2,
  Mail,
  Megaphone,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Item = { id: string; type: string; message: string; createdAt: string };

const ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  suggestion_accepted: { icon: CheckCircle2, color: "text-green-400" },
  suggestion_rejected: { icon: XCircle, color: "text-red-400" },
  suggestion_question: { icon: HelpCircle, color: "text-amber-400" },
  creator_role_approved: { icon: Sparkles, color: "text-accent-light" },
  creator_role_rejected: { icon: XCircle, color: "text-red-400" },
  creator_post_rejected: { icon: XCircle, color: "text-red-400" },
  player_link_accepted: { icon: Link2, color: "text-green-400" },
  player_link_rejected: { icon: XCircle, color: "text-red-400" },
  badge_earned: { icon: Trophy, color: "text-amber-400" },
  announcement: { icon: Megaphone, color: "text-blue-400" },
  admin_message: { icon: Mail, color: "text-purple-400" },
};

// La pop-up existante marque les notifs comme lues dès l'affichage :
// la pastille de la cloche se base donc sur la dernière ouverture de la cloche.
const LAST_OPEN_KEY = "flashback-bell-last-open";

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
function ago(iso: string) {
  const s = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const a = Math.abs(s);
  if (a < 60) return "à l’instant";
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86400), "day");
}

function readLastOpen(): string {
  try {
    return localStorage.getItem(LAST_OPEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  // Lu au premier rendu : les items sont vides tant que le fetch n'a pas répondu, donc pas d'écart serveur/client.
  const [lastOpen, setLastOpen] = useState(() =>
    typeof window === "undefined" ? "" : readLastOpen(),
  );
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch("/api/notifications/inbox", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: Item[] }) => setItems(d.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  // Fermer au clic à l'extérieur ou avec Échap.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((i) => i.createdAt > lastOpen).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      load();
      const now = new Date().toISOString();
      try {
        localStorage.setItem(LAST_OPEN_KEY, now);
      } catch {
        /* navigation privée : pas grave */
      }
      // On garde l'ancien repère pendant l'ouverture pour surligner les nouveautés.
      setTimeout(() => setLastOpen(now), 4000);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={
          unread
            ? `Notifications, ${unread} nouvelle${unread > 1 ? "s" : ""}`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-text-primary">
              Notifications
            </span>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">
              Aucune notification pour l’instant.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((n) => {
                const cfg = ICONS[n.type] ?? {
                  icon: Bell,
                  color: "text-text-muted",
                };
                const Icon = cfg.icon;
                const isNew = n.createdAt > lastOpen;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "flex gap-3 border-b border-border px-4 py-3 last:border-b-0",
                      isNew && "bg-accent/10",
                    )}
                  >
                    <Icon
                      className={cn("mt-0.5 h-4 w-4 flex-none", cfg.color)}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-text-primary">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {ago(n.createdAt)}
                      </p>
                    </div>
                    {isNew && (
                      <span
                        className="mt-1.5 h-2 w-2 flex-none rounded-full bg-accent"
                        aria-label="nouveau"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
