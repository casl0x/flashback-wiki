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

// Les ids déjà toastés dans cet onglet : pour ne jamais re-toaster en changeant de page.
const SHOWN_KEY = "flashback-toasted-notifications";

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
 * Observe les notifications en arrière-plan et les toaste une seule fois
 * (les annonces ont leur propre modale : AnnouncementModal). Ne marque jamais rien comme lu : c'est la cloche, ou
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

    if (!isSignedIn) return;
    checkSignedIn();
    const interval = setInterval(checkSignedIn, 60_000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, toast]);

  return null;
}
