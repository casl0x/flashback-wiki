"use client";

import { useToast } from "@/app/_composents/toast/ToastProvider";
import { createReport } from "@/app/profil/actions";
import { Flag } from "lucide-react";
import { useState } from "react";

export function ReportButton({
  targetType,
  targetId,
  className,
  label = "Signaler",
  ariaLabel,
}: {
  targetType: "POST" | "PROFILE";
  targetId: string;
  className?: string;
  label?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const toast = useToast();

  async function submit() {
    setSending(true);
    try {
      await createReport({
        targetType,
        targetId,
        reason: reason.trim() || undefined,
      });
      toast({
        tone: "success",
        title: "Signalement envoyé",
        text: "Un admin va l'examiner.",
      });
      setOpen(false);
      setReason("");
    } catch (err) {
      toast({
        tone: "error",
        title: "Signalement impossible",
        text: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel ?? label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={className}
      >
        <Flag className="h-3 w-3" />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Signaler ce contenu"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-[#23262D] bg-[#15171B] p-4"
          >
            <p className="m-0 text-[14px] font-bold text-[#ECECEE]">
              Signaler ce contenu
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique le problème (optionnel)"
              aria-label="Motif du signalement"
              className="h-20 resize-none rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 py-2 text-[13px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
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
                disabled={sending}
                className="rounded-md bg-[#C8343A] px-3 py-1.5 text-[13px] font-bold text-white hover:bg-[#B02E33] disabled:opacity-50"
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
