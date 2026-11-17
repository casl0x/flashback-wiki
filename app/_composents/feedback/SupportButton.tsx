"use client";

import { cn } from "@/lib/utils";
import { Heart, X } from "lucide-react";
import { useEffect, useState } from "react";

// Nom d'utilisateur PayPal.me (la partie après paypal.me/). Sans lui, le bouton n'est pas affiché.
const PAYPAL_USER = (process.env.NEXT_PUBLIC_PAYPAL_ME ?? "")
  .trim()
  .replace(/^https?:\/\/(www\.)?paypal\.me\//i, "")
  .replace(/\/.*$/, "");

const QUICK = [3, 5, 10, 20];
const MIN = 1;
const MAX = 500;

function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(",", ".").trim());
  if (!Number.isFinite(n) || n < MIN || n > MAX) return null;
  return Math.round(n * 100) / 100;
}

export default function SupportButton() {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!PAYPAL_USER) return null;

  const amount = parseAmount(raw);

  function donate() {
    if (amount == null) return;
    window.open(
      `https://www.paypal.me/${encodeURIComponent(PAYPAL_USER)}/${amount}EUR`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

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
              <p className="m-0 mt-1 text-[13px] text-[#C4C7CF]">
                Montant libre, aucun avantage en échange. Les soutiens servent
                uniquement à payer l&apos;hébergement et le stockage.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="support-amount"
                className="text-[11px] font-bold uppercase tracking-wider text-[#6E7380]"
              >
                Montant (€)
              </label>
              <input
                id="support-amount"
                type="text"
                inputMode="decimal"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && donate()}
                placeholder="Ex : 5"
                autoComplete="off"
                className="rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 py-2.5 text-[14px] text-[#ECECEE] outline-none focus:border-[#F5A300]"
              />
              <div className="flex gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setRaw(String(q))}
                    aria-pressed={amount === q}
                    className={cn(
                      "flex-1 rounded-md border px-2 py-1.5 text-[13px] font-semibold",
                      amount === q
                        ? "border-[#F5A300] bg-[#F5A300]/15 text-[#ECECEE]"
                        : "border-[#3A3E47] text-[#C4C7CF] hover:border-[#6E7380]",
                    )}
                  >
                    {q} €
                  </button>
                ))}
              </div>
              {raw.trim() !== "" && amount == null && (
                <p className="m-0 text-[11px] text-red-400">
                  Entre un montant entre {MIN} et {MAX} €.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={donate}
              disabled={amount == null}
              className="rounded-md bg-[#F5A300] px-3 py-2.5 text-[13px] font-bold uppercase tracking-wider text-black hover:bg-[#E09500] disabled:opacity-50"
            >
              Continuer vers PayPal
            </button>
            <p className="m-0 -mt-2 text-center text-[11px] text-[#6E7380]">
              Le paiement se fait sur PayPal, dans un nouvel onglet.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
