"use client";

import { useUser } from "@clerk/nextjs";
import {
  CheckCircle2,
  Mail,
  Megaphone,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

type Notif = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

const ICONS: Record<string, { icon: typeof Sparkles; color: string }> = {
  suggestion_accepted: { icon: CheckCircle2, color: "text-green-400" },
  suggestion_rejected: { icon: XCircle, color: "text-red-400" },
  creator_role_approved: { icon: Sparkles, color: "text-accent-light" },
  creator_role_rejected: { icon: XCircle, color: "text-red-400" },
  announcement: { icon: Megaphone, color: "text-blue-400" },
  admin_message: { icon: Mail, color: "text-purple-400" },
};

const SEEN_ANNOUNCEMENT_KEY = "flashback-last-seen-announcement";

export function NotificationPopup() {
  const { isLoaded, isSignedIn } = useUser();
  const [queue, setQueue] = useState<Notif[]>([]);

  useEffect(() => {
    if (!isLoaded) return;

    // Connecté : notifications perso + annonces, "déjà vu" suivi côté serveur.
    function checkSignedIn() {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d) && d.length) {
            setQueue((q) => [...q, ...d]);
          }
        });
    }

    // Visiteur anonyme : pas de profil en base, donc "déjà vu" suivi dans
    // le navigateur. Seules les annonces publiques peuvent le concerner.
    function checkAnonymous() {
      fetch("/api/announcements/active")
        .then((r) => r.json())
        .then(
          (
            announcements: { id: string; message: string; createdAt: string }[],
          ) => {
            if (!Array.isArray(announcements) || !announcements.length) return;

            let lastSeen = 0;
            try {
              lastSeen = Number(
                localStorage.getItem(SEEN_ANNOUNCEMENT_KEY) ?? 0,
              );
            } catch {
              // localStorage indisponible (navigation privée, etc.)
            }

            const unseen = announcements.filter(
              (a) => new Date(a.createdAt).getTime() > lastSeen,
            );
            if (!unseen.length) return;

            setQueue((q) => [
              ...q,
              ...unseen.map((a) => ({
                id: `ann-${a.id}`,
                type: "announcement",
                message: a.message,
                createdAt: a.createdAt,
              })),
            ]);

            const latest = Math.max(
              ...announcements.map((a) => new Date(a.createdAt).getTime()),
            );
            try {
              localStorage.setItem(SEEN_ANNOUNCEMENT_KEY, String(latest));
            } catch {
              // idem
            }
          },
        );
    }

    const check = isSignedIn ? checkSignedIn : checkAnonymous;
    check();
    const interval = setInterval(check, 45000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn]);

  function dismiss(id: string) {
    setQueue((q) => q.filter((n) => n.id !== id));
  }

  if (!queue.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-[min(340px,calc(100vw-2rem))] flex-col gap-2">
      {queue.map((n) => (
        <Toast key={n.id} notif={n} onClose={() => dismiss(n.id)} />
      ))}
    </div>
  );
}

function Toast({ notif, onClose }: { notif: Notif; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  const cfg = ICONS[notif.type] ?? {
    icon: Sparkles,
    color: "text-accent-light",
  };
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3 shadow-lg animate-in fade-in slide-in-from-bottom-4">
      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.color}`} />
      <p className="flex-1 text-[12px] text-text-secondary leading-snug">
        {notif.message}
      </p>
      <button
        onClick={onClose}
        className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
