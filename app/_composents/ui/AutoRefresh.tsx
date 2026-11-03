"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Sur iPad/iPhone, une app ajoutée à l'écran d'accueil reste suspendue en
// mémoire et ne recharge pas la page à la réouverture. On rafraîchit donc les
// données quand l'app redevient visible après un moment en arrière-plan.
const MIN_HIDDEN_MS = 30_000;
const MAX_AGE_MS = 5 * 60_000;

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let hiddenAt: number | null = null;
    let lastRefresh = Date.now();

    const refresh = () => {
      lastRefresh = Date.now();
      router.refresh();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      const away = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = null;
      if (away >= MIN_HIDDEN_MS || Date.now() - lastRefresh >= MAX_AGE_MS) {
        refresh();
      }
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  return null;
}
