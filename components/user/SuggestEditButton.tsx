"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Character } from "@/lib/db";
import { useUser } from "@clerk/nextjs";
import { Pencil } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function SuggestEditButton({ character }: { character: Character }) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nom: character.nom,
    metier: character.metier ?? "",
    groupe: character.groupe ?? "",
    description: character.description ?? "",
    note: "",
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  function handleClick() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${pathname}`);
      return;
    }
    setOpen(true);
  }

  async function submit() {
    setLoading(true);
    await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: character.id, ...form }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary px-2.5 py-1 rounded-lg border border-border hover:border-border-mid transition-colors"
      >
        <Pencil className="w-3 h-3" />
        Proposer une modification
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSent(false);
        }}
      >
        <DialogContent className="bg-card border-border-mid max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[14px]">
              Proposer une modification
            </DialogTitle>
          </DialogHeader>

          {sent ? (
            <div className="py-6 text-center">
              <p className="text-[13px] text-text-secondary">
                Merci ! Ta proposition a bien été envoyée.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[
                { label: "Nom", key: "nom", placeholder: character.nom },
                {
                  label: "Métier",
                  key: "metier",
                  placeholder: character.metier ?? "—",
                },
                {
                  label: "Groupe",
                  key: "groupe",
                  placeholder: character.groupe ?? "—",
                },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-widest text-text-muted">
                    {label}
                  </label>
                  <Input
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted">
                  Description
                </label>
                <textarea
                  className="h-16 resize-none rounded-md px-3 py-2 bg-input border border-border text-[13px]"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder={character.description ?? "—"}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted">
                  Note (exemple: relations, lieux de vie, etc - optionnel)
                </label>
                <Input
                  value={form.note}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, note: e.target.value }))
                  }
                  placeholder="Relations, localisation, lien reddif, précisions…"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="border-border-mid text-text-secondary cursor-pointer"
            >
              {sent ? "Fermer" : "Annuler"}
            </Button>
            {!sent && (
              <Button
                size="sm"
                onClick={submit}
                disabled={loading}
                className="bg-accent hover:bg-accent-hover text-white border-0 cursor-pointer"
              >
                {loading ? "…" : "Envoyer"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
