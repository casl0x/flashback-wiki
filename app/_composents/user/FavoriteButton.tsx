"use client";

import { useToast } from "@/app/_composents/toast/ToastProvider";
import { toggleFavorite } from "@/app/profil/actions";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

type Kind = "PLAYER" | "CHARACTER";

// Un seul fetch par chargement de page, partagé entre tous les boutons cœur.
type FavoritesPayload = { items: { kind: Kind; targetId: string }[]; enabled: boolean };
let pending: Promise<FavoritesPayload> | null = null;
function loadFavorites() {
  pending ??= fetch("/api/favorites", { cache: "no-store" })
    .then((r) => r.json())
    .then((d): FavoritesPayload => ({
      items: Array.isArray(d.items) ? d.items : [],
      enabled: d.enabled === true,
    }))
    .catch((): FavoritesPayload => ({ items: [], enabled: false }));
  return pending;
}

/** Cœur « mettre en favori » d'une fiche joueur ou personnage (comptes connectés). */
export function FavoriteButton({
  kind,
  targetId,
  className,
}: {
  kind: Kind;
  targetId: string;
  className?: string;
}) {
  const { isLoaded, isSignedIn } = useUser();
  const toast = useToast();
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    loadFavorites().then(({ items, enabled }) => {
      if (cancelled) return;
      setEnabled(enabled);
      setActive(items.some((f) => f.kind === kind && f.targetId === targetId));
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, kind, targetId]);

  const base = cn(
    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors",
    active
      ? "border-[#E5484D] bg-[#2A1416] text-[#FF8A8E]"
      : "border-[#3A3E47] bg-[#0E0F12]/70 text-[#C4C7CF] hover:border-[#FF8A8E] hover:text-[#FF8A8E]",
    className,
  );

  // Fonctionnalité en test : invisible sauf pour les admins (et pour les visiteurs).
  if (!isLoaded || !isSignedIn || !enabled) return null;

  async function handleClick() {
    if (busy) return;
    const next = !active;
    setActive(next);
    setBusy(true);
    try {
      const result = await toggleFavorite(kind, targetId);
      setActive(result);
      // Garde le cache partagé cohérent pour les autres boutons de la page.
      pending = null;
    } catch (err) {
      setActive(!next);
      toast({
        tone: "error",
        title: "Favori impossible",
        text: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={active}
      className={base}
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} />
      {active ? "Favori" : "Ajouter aux favoris"}
    </button>
  );
}
