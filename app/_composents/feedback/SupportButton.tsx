"use client";

import { Heart, X } from "lucide-react";
import { useEffect, useState } from "react";

// URL complète de la page Tipeee (ex. https://fr.tipeee.com/ton-pseudo).
// Sans elle (ou si elle n'est pas en https), le bouton n'est pas affiché.
const TIPEEE_URL = (process.env.NEXT_PUBLIC_TIPEEE_URL ?? "").trim();
const VALID = /^https:\/\//i.test(TIPEEE_URL);

export default function SupportButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!VALID) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Soutenir le site"
        className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
      >
        <Heart className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Soutenir</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Soutenir le site"
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-md flex-col gap-4 rounded-xl border border-[#23262D] bg-[#15171B] p-5"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-[#3A3E47] text-[#C4C7CF] hover:border-[#6E7380]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="pr-10">
              <p className="m-0 text-[16px] font-bold uppercase tracking-wider text-[#F5A300]">
                💖 Soutenir le site
              </p>
              <p className="m-0 mt-2 text-[13px] leading-relaxed text-[#C4C7CF]">
                Le site est gratuit et sans publicité. Tu peux le soutenir avec
                le montant que tu veux, sans aucun avantage en échange. Les
                soutiens servent uniquement à payer l&apos;hébergement et le
                stockage.
              </p>
            </div>

            <a
              href={TIPEEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="rounded-md bg-[#F5A300] px-3 py-2.5 text-center text-[13px] font-bold uppercase tracking-wider text-black hover:bg-[#E09500]"
            >
              Continuer vers Tipeee
            </a>
            <p className="m-0 -mt-2 text-center text-[11px] text-[#6E7380]">
              Le paiement se fait sur Tipeee, dans un nouvel onglet.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
