"use client";

import { useToast } from "@/app/_composents/toast/ToastProvider";
import { FEEDBACK_CATEGORIES, type FeedbackType } from "@/lib/feedback-categories";
import { cn } from "@/lib/utils";
import { MessageSquareWarning } from "lucide-react";
import { useState } from "react";

const MIN = 5;

const field =
  "rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 py-2 text-[13px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [categorie, setCategorie] = useState("");
  const [message, setMessage] = useState("");
  const [etapes, setEtapes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const toast = useToast();

  async function submit() {
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          categorie,
          message,
          etapes,
          website,
          page: window.location.href,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Envoi impossible");
      toast({
        tone: "success",
        title: "Merci !",
        text: type === "bug" ? "Bug signalé à l'équipe." : "Suggestion transmise à l'équipe.",
      });
      setOpen(false);
      setMessage("");
      setEtapes("");
      setCategorie("");
    } catch (err) {
      toast({
        tone: "error",
        title: "Envoi impossible",
        text: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSending(false);
    }
  }

  const tab = (t: FeedbackType, label: string) => (
    <button
      type="button"
      onClick={() => {
        setType(t);
        setCategorie("");
      }}
      aria-pressed={type === t}
      className={cn(
        "flex-1 rounded-md border px-3 py-1.5 text-[13px] font-semibold",
        type === t
          ? "border-[#2F6FEB] bg-[#2F6FEB]/15 text-[#ECECEE]"
          : "border-[#3A3E47] text-[#C4C7CF] hover:border-[#6E7380]",
      )}
    >
      {label}
    </button>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Signaler un bug ou faire une suggestion"
        className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
      >
        <MessageSquareWarning className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Report</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Report"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-[#23262D] bg-[#15171B] p-4"
          >
            <p className="m-0 text-[14px] font-bold text-[#ECECEE]">Report</p>
            <div className="flex gap-2">
              {tab("bug", "🐛 Bug")}
              {tab("suggestion", "💡 Suggestion")}
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E7380]">
                {type === "bug" ? "Où est le problème ?" : "Sujet de l'idée"}
              </span>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                aria-label="Catégorie"
                className={field}
              >
                <option value="">— Choisir —</option>
                {FEEDBACK_CATEGORIES[type].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1500}
              placeholder={type === "bug" ? "Décris le bug" : "Décris ton idée"}
              aria-label="Message"
              className={cn(field, "h-24 resize-none")}
            />
            {message.trim().length < MIN && (
              <p className="m-0 text-[11px] text-[#6E7380]">
                Minimum {MIN} caractères ({message.trim().length}/{MIN}).
              </p>
            )}
            {type === "bug" && (
              <textarea
                value={etapes}
                onChange={(e) => setEtapes(e.target.value)}
                maxLength={1000}
                placeholder="Étapes pour reproduire (optionnel)"
                aria-label="Étapes pour reproduire"
                className={cn(field, "h-16 resize-none")}
              />
            )}
            {/* Honeypot : invisible pour les humains. */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-[#3A3E47] px-3 py-1.5 text-[13px] font-semibold text-[#C4C7CF] hover:border-[#6E7380]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={sending || !categorie || message.trim().length < MIN}
                className="rounded-md bg-[#2F6FEB] px-3 py-1.5 text-[13px] font-bold text-white hover:bg-[#2860CF] disabled:opacity-50"
              >
                {sending ? "…" : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
