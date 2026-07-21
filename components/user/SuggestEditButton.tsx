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
import { Pencil, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "create" | "edit";

interface SuggestButtonProps {
  mode: Mode;
  character?: Character; // requis en mode "edit"
}

const EMPTY_FORM = {
  nom: "",
  metier: "",
  groupe: "",
  description: "",
  note: "",
};

export function SuggestButton({ mode, character }: SuggestButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(() =>
    mode === "edit" && character
      ? {
          nom: character.nom,
          metier: character.metier ?? "",
          groupe: character.groupe ?? "",
          description: character.description ?? "",
          note: "",
        }
      : EMPTY_FORM,
  );

  function handleClick() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${pathname}`);
      return;
    }
    setOpen(true);
  }

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (!o) setSent(false);
  }

  async function submit() {
    setLoading(true);

    const endpoint = "/api/suggestions";
    const body =
      mode === "edit" ? { characterId: character?.id, ...form } : { ...form }; // pas de characterId → nouveau perso

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    setSent(true);
  }

  const isEdit = mode === "edit";

  const fields: {
    label: string;
    key: keyof typeof form;
    placeholder: string;
  }[] = [
    {
      label: "Nom",
      key: "nom",
      placeholder: isEdit ? (character?.nom ?? "") : "Nom du personnage",
    },
    {
      label: "Métier",
      key: "metier",
      placeholder: isEdit ? (character?.metier ?? "—") : "Métier",
    },
    {
      label: "Groupe",
      key: "groupe",
      placeholder: isEdit ? (character?.groupe ?? "—") : "Groupe",
    },
  ];

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary px-2.5 py-1 rounded-lg border border-border hover:border-border-mid transition-colors"
      >
        {isEdit ? (
          <>
            <Pencil className="w-3 h-3" />
            Proposer une modification
          </>
        ) : (
          <>
            <Plus className="w-3 h-3" />
            Proposer un personnage
          </>
        )}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-card border-border-mid max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[14px]">
              {isEdit
                ? "Proposer une modification"
                : "Proposer un nouveau personnage"}
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
              {fields.map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-widest text-text-muted">
                    {label}
                  </label>
                  <Input
                    value={form[key]}
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
                  placeholder={
                    isEdit
                      ? (character?.description ?? "—")
                      : "Description du personnage"
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted">
                  Note (relations, lieux de vie, etc — optionnel)
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
