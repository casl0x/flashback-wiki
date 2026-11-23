"use client";

import { cn } from "@/lib/utils";
import { useLayoutEffect, useRef, useState } from "react";

// Au-delà de la hauteur max + cette marge, on replie ; en dessous, on affiche tout
// (inutile de cacher une ou deux lignes derrière un bouton).
const TOLERANCE = 48;

/**
 * Affiche le début d'un texte long avec un fondu et un bouton « Voir plus ». Le texte
 * complet reste dans la page (lisible par les moteurs de recherche, même replié).
 */
export default function ExpandableText({
  children,
  maxHeight = 220,
  className,
}: {
  children: React.ReactNode;
  /** Hauteur visible quand le texte est replié, en pixels. */
  maxHeight?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  // Mesure le texte complet, et le re-mesure s'il change de taille (police chargée,
  // largeur de la fenêtre, version qui passe de masquée à affichée).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflowing(el.scrollHeight > maxHeight + TOLERANCE);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxHeight]);

  const collapsed = overflowing && !open;

  return (
    <div className={className}>
      <div
        ref={ref}
        className="overflow-hidden"
        style={{
          maxHeight: collapsed ? maxHeight : undefined,
          // Fondu sur le bas, quel que soit le fond de la carte.
          maskImage: collapsed ? "linear-gradient(to bottom, #000 62%, transparent)" : undefined,
          WebkitMaskImage: collapsed ? "linear-gradient(to bottom, #000 62%, transparent)" : undefined,
        }}
      >
        {children}
      </div>
      {overflowing && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "mt-2 text-[13px] font-bold uppercase tracking-[0.12em] text-(--c) hover:opacity-80",
          )}
        >
          {open ? "Voir moins ▴" : "Voir plus ▾"}
        </button>
      )}
    </div>
  );
}
