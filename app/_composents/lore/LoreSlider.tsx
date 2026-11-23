"use client";

import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type SliderVersion = {
  id: string;
  label: string;
  color: string;
  /** Image d'ambiance déjà transformée (Cloudinary), ou null. */
  imageUrl: string | null;
  enCours: boolean;
  /** « 3 événements · 1 texte » */
  count: string;
  /** Contenu de la version, rendu côté serveur. */
  pane: React.ReactNode;
};

/**
 * Slider de versions : une carte par version, et seul le contenu de la version choisie est
 * affiché. Tous les contenus restent dans la page (masqués), ce qui garde le texte lisible
 * pour les moteurs de recherche. La version choisie est gardée dans l'adresse (?v=V5).
 */
export default function LoreSlider({
  versions,
  initialId,
}: {
  versions: SliderVersion[];
  /** Version demandée dans l'adresse (?v=V5), lue côté serveur. */
  initialId?: string;
}) {
  const requested = versions.findIndex((v) => v.id === initialId);
  const defaultIndex = requested >= 0 ? requested : Math.max(0, versions.findIndex((v) => v.enCours));
  const [cur, setCur] = useState(defaultIndex);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const accent = versions[cur]?.color ?? "#E63946";

  const scrollToCard = useCallback((i: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[i];
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - 20, behavior: "smooth" });
  }, []);

  const go = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(versions.length - 1, i));
      if (next === cur) return;
      setDir(next > cur ? "next" : "prev");
      setCur(next);
      scrollToCard(next);
      const url = new URL(window.location.href);
      url.searchParams.set("v", versions[next].id);
      window.history.replaceState(null, "", url);
    },
    [cur, scrollToCard, versions],
  );

  // Au chargement : amène la carte de la version affichée dans la rangée.
  useEffect(() => {
    requestAnimationFrame(() => scrollToCard(defaultIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flèches du clavier (sauf dans un champ de saisie).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "ArrowRight") go(cur + 1);
      if (e.key === "ArrowLeft") go(cur - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur, go]);

  return (
    <div style={{ "--c": accent } as React.CSSProperties}>
      <div className="relative -mx-5 mt-4">
        <button
          type="button"
          aria-label="Version précédente"
          disabled={cur === 0}
          onClick={() => go(cur - 1)}
          className="absolute top-23 left-2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#3A3E47] bg-[#0a0a0c]/85 text-white hover:border-white disabled:opacity-30 md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Version suivante"
          disabled={cur === versions.length - 1}
          onClick={() => go(cur + 1)}
          className="absolute top-23 right-2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#3A3E47] bg-[#0a0a0c]/85 text-white hover:border-white disabled:opacity-30 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={trackRef}
          role="tablist"
          aria-label="Versions"
          className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-px-5 px-5 pt-1.5 pb-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {versions.map((v, i) => {
            const on = i === cur;
            return (
              <button
                key={v.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`lore-pane-${v.id}`}
                onClick={() => go(i)}
                style={{ "--c": v.color } as React.CSSProperties}
                className={cn(
                  "relative h-47.5 w-[min(78vw,340px)] flex-none snap-start overflow-hidden rounded-[14px] border bg-[#111] p-0 text-left transition-[opacity,transform,box-shadow,border-color] duration-200 hover:opacity-100",
                  on
                    ? "border-(--c) opacity-100 shadow-[0_0_0_1px_var(--c),0_10px_30px_color-mix(in_srgb,var(--c)_22%,transparent)]"
                    : "scale-[0.97] border-[#23262D] opacity-55",
                )}
              >
                <span
                  className="absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_0%,color-mix(in_srgb,var(--c)_45%,transparent),transparent_60%),repeating-linear-gradient(135deg,#17191e_0_12px,#111317_12px_24px)]"
                  aria-hidden
                />
                {v.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.imageUrl}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <span className="absolute inset-0 bg-linear-to-t from-[#0a0a0c] from-8% to-transparent to-70%" aria-hidden />
                <span className="absolute inset-x-0 bottom-0 h-1 bg-(--c)" aria-hidden />
                {v.enCours && (
                  <span className="absolute top-3 right-3 rounded-full bg-[#11281C] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#6EE7A0]">
                    En cours
                  </span>
                )}
                <span className="absolute inset-x-4.5 bottom-4.5 flex flex-col">
                  <span
                    className={cn(anton.className, "text-[64px] leading-[0.9] font-normal uppercase text-(--c)")}
                  >
                    {v.id}
                  </span>
                  <span className="mt-1 text-[15px] font-extrabold text-[#ECECEE]">{v.label}</span>
                  <span className="mt-1 text-[12px] tracking-[0.06em] text-[#8D93A0]">{v.count}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center gap-2" aria-hidden>
          {versions.map((v, i) => (
            <button
              key={v.id}
              type="button"
              tabIndex={-1}
              onClick={() => go(i)}
              className={cn(
                "h-[7px] rounded-full transition-all duration-200",
                i === cur ? "w-5.5 bg-(--c)" : "w-[7px] bg-[#2a2d35]",
              )}
            />
          ))}
        </div>
      </div>

      <div
        className="mt-7"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStart.current = (e.target as HTMLElement).closest("[data-no-swipe]")
            ? null
            : { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const s = touchStart.current;
          touchStart.current = null;
          if (!s) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - s.x;
          // Glissement horizontal net seulement : on ne gêne pas le défilement vertical.
          if (Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(t.clientY - s.y)) go(cur + (dx < 0 ? 1 : -1));
        }}
      >
        {versions.map((v, i) => (
          <div
            key={v.id}
            id={`lore-pane-${v.id}`}
            role="tabpanel"
            hidden={i !== cur}
            style={{ "--c": v.color } as React.CSSProperties}
            className={dir === "next" ? "lore-slide-next" : "lore-slide-prev"}
          >
            {v.pane}
          </div>
        ))}
      </div>
    </div>
  );
}
