"use client";

import { useToast } from "@/app/_composents/toast/ToastProvider";
import { getNotificationKind } from "@/lib/notification-kinds";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

type Item = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};
type Announcement = { id: string; message: string; createdAt: string };

// Les ids déjà toastés dans cet onglet : pour ne jamais re-toaster en changeant de page.
const SHOWN_KEY = "flashback-toasted-notifications";
const SEEN_ANNOUNCEMENT_KEY = "flashback-last-seen-announcement";

function readShown(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SHOWN_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function writeShown(ids: Set<string>) {
  try {
    sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...ids]));
  } catch {
    // navigation privée : pas grave
  }
}

/**
 * Observe les notifications et annonces en arrière-plan et les toaste une
 * seule fois. Ne marque jamais rien comme lu : c'est la cloche, ou
 * « Tout marquer comme lu », qui s'en charge.
 */
export function NotificationWatcher() {
  const { isLoaded, isSignedIn } = useUser();
  const toast = useToast();

  useEffect(() => {
    if (!isLoaded) return;

    function checkSignedIn() {
      fetch("/api/notifications", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d: { items?: Item[] }) => {
          const items = d.items ?? [];
          const shown = readShown();
          const fresh = items.filter((i) => !i.read && !shown.has(i.id));
          if (!fresh.length) return;

          for (const item of fresh) {
            const kind = getNotificationKind(item.type);
            toast({
              tone: kind.tone,
              title: kind.label,
              text: item.message,
              action: kind.href
                ? { label: "Voir", href: kind.href }
                : undefined,
            });
            shown.add(item.id);
          }
          writeShown(shown);
        })
        .catch(() => {});
    }

    // Visiteur anonyme : pas de profil en base, donc "déjà vu" suivi dans
    // le navigateur. Seules les annonces publiques peuvent le concerner.
    function checkAnonymous() {
      fetch("/api/announcements/active")
        .then((r) => r.json())
        .then((announcements: Announcement[]) => {
          if (!Array.isArray(announcements) || !announcements.length) return;

          let lastSeen = 0;
          try {
            lastSeen = Number(localStorage.getItem(SEEN_ANNOUNCEMENT_KEY) ?? 0);
          } catch {
            // navigation privée, etc.
          }

          const unseen = announcements.filter(
            (a) => new Date(a.createdAt).getTime() > lastSeen,
          );
          if (!unseen.length) return;

          for (const a of unseen) {
            toast({ tone: "info", title: "Annonce", text: a.message });
          }

          const latest = Math.max(
            ...announcements.map((a) => new Date(a.createdAt).getTime()),
          );
          try {
            localStorage.setItem(SEEN_ANNOUNCEMENT_KEY, String(latest));
          } catch {
            // idem
          }
        })
        .catch(() => {});
    }

    const check = isSignedIn ? checkSignedIn : checkAnonymous;
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, toast]);

  return null;
}
