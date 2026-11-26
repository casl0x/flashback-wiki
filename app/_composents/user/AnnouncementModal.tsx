"use client";

import { useUser } from "@clerk/nextjs";
import { Megaphone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Announcement = { id: string; message: string; createdAt: string };

const SEEN_KEY = "flashback-last-seen-announcement";
// Pages où une modale gênerait (inscription, connexion).
const HIDDEN_ON = ["/onboarding", "/sign-in", "/sign-up"];

/**
 * Affiche les annonces publiées par l'admin dans une modale centrée, une seule
 * fois par personne : suivi en base (lastSeenAnnouncementAt) pour un compte,
 * dans le navigateur (localStorage) pour un visiteur.
 */
export function AnnouncementModal() {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const [items, setItems] = useState<Announcement[]>([]);

  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));
  const open = items.length > 0 && !hidden;

  useEffect(() => {
    if (!isLoaded || hidden) return;

    function check() {
      fetch("/api/announcements/active", { cache: "no-store" })
        .then((r) => r.json())
        .then((list: Announcement[]) => {
          if (!Array.isArray(list)) return;
          let unseen = list;
          if (!isSignedIn) {
            let lastSeen = 0;
            try {
              lastSeen = Number(localStorage.getItem(SEEN_KEY) ?? 0);
            } catch {
              // navigation privée, etc.
            }
            unseen = list.filter((a) => new Date(a.createdAt).getTime() > lastSeen);
          }
          // Ne remplace pas une modale déjà ouverte par une liste identique.
          setItems((prev) =>
            prev.length === unseen.length && prev.every((a, i) => a.id === unseen[i].id)
              ? prev
              : unseen,
          );
        })
        .catch(() => {});
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, hidden]);

  const dismiss = useCallback(() => {
    const latest = Math.max(...items.map((a) => new Date(a.createdAt).getTime()));
    setItems([]);
    if (isSignedIn) {
      fetch("/api/announcements/seen", { method: "POST" }).catch(() => {});
    } else {
      try {
        localStorage.setItem(SEEN_KEY, String(latest));
      } catch {
        // idem
      }
    }
  }, [items, isSignedIn]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-h"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col gap-4 rounded-xl border border-[#23262D] bg-[#15171B] p-5"
      >
        <p
          id="announcement-h"
          className="m-0 flex items-center gap-2 text-[16px] font-bold text-[#ECECEE]"
        >
          <Megaphone className="h-4 w-4 text-[#8AB4FF]" />
          {items.length > 1 ? "Annonces" : "Annonce"}
        </p>
        <div className="flex flex-col gap-3 overflow-y-auto">
          {items.map((a) => (
            <p
              key={a.id}
              className="m-0 whitespace-pre-wrap rounded-md bg-[#0E0F12] p-3 text-[14px] leading-relaxed text-[#C4C7CF]"
            >
              {a.message}
            </p>
          ))}
        </div>
        <button
          type="button"
          autoFocus
          onClick={dismiss}
          className="min-h-11 rounded-md bg-[#2F6FEB] px-3.5 text-[14px] font-bold text-white hover:bg-[#4A82F0]"
        >
          J&apos;ai compris
        </button>
      </div>
    </div>
  );
}
