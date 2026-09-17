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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Character, Version } from "@/lib/db";
import { useUser } from "@clerk/nextjs";
import { Pencil, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Mode = "create" | "edit";

interface SuggestButtonProps {
  mode: Mode;
  character?: Character; // requis en mode "edit"
}

const EMPTY_FORM = {
  nom: "",
  metier: "",
  groupe: "",
  role: "",
  etatVie: "",
  joueur: "",
  versionId: "",
  lienReddif: "",
  description: "",
  note: "",
};

const ROLES = [
  { label: "Civil", value: "civil" },
  { label: "Illégal", value: "illegal" },
];

const ETATS_VIE = [
  { label: "En vie", value: "EN_VIE" },
  { label: "Mort", value: "MORT" },
  { label: "Parti", value: "PARTI" },
  { label: "Disparu", value: "DISPARU" },
  { label: "En prison", value: "PRISON" },
];

export function SuggestButton({ mode, character }: SuggestButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [groupeNames, setGroupeNames] = useState<string[]>([]);
  const [playerPseudos, setPlayerPseudos] = useState<string[]>([]);

  const [form, setForm] = useState(() =>
    mode === "edit" && character
      ? {
          nom: character.nom,
          metier: character.metier ?? "",
          groupe: character.groupes?.map((g) => g.nom).join(", ") ?? "",
          role: character.role ?? "",
          etatVie: character.etatVie ?? "",
          joueur: character.player?.pseudo ?? "",
          versionId: character.versionId ?? "",
          lienReddif: character.lienReddif ?? "",
          description: character.description ?? "",
          note: "",
        }
      : EMPTY_FORM,
  );

  useEffect(() => {
    if (!open || versions.length || groupeNames.length || playerPseudos.length)
      return;
    Promise.all([
      fetch("/api/versions").then((r) => r.json()),
      fetch("/api/groupes").then((r) => r.json()),
      fetch("/api/players").then((r) => r.json()),
    ])
      .then(([v, g, p]) => {
        setVersions(v ?? []);
        setGroupeNames((g ?? []).map((x: { nom: string }) => x.nom));
        setPlayerPseudos((p ?? []).map((x: { pseudo: string }) => x.pseudo));
      })
      .catch(console.error);
  }, [open, versions.length, groupeNames.length, playerPseudos.length]);

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
    const body = {
      ...(mode === "edit" ? { characterId: character?.id } : {}),
      nom: form.nom,
      metier: form.metier,
      groupe: form.groupe,
      description: form.description,
      note: form.note,
      role: form.role || null,
      etatVie: form.etatVie || null,
      joueur: form.joueur || null,
      versionId: form.versionId || null,
      lienReddif: form.lienReddif || null,
    };

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
    key: "nom" | "metier" | "groupe";
    placeholder: string;
    listId?: string;
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
      placeholder: isEdit
        ? (character?.groupes?.map((g) => g.nom).join(", ") ?? "—")
        : "Groupe",
      listId: "suggest-groupes",
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
        <DialogContent className="bg-card border-border-mid max-w-sm max-h-[90vh] overflow-y-auto">
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
              {fields.map(({ label, key, placeholder, listId }) => (
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
                    list={listId}
                  />
                  {listId === "suggest-groupes" && (
                    <datalist id="suggest-groupes">
                      {groupeNames.map((nom) => (
                        <option key={nom} value={nom} />
                      ))}
                    </datalist>
                  )}
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-widest text-text-muted">
                    Rôle
                  </label>
                  <Select
                    value={form.role}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, role: v ?? "" }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Rôle</SelectLabel>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-widest text-text-muted">
                    État de vie
                  </label>
                  <Select
                    value={form.etatVie}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, etatVie: v ?? "" }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="État" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>État de vie</SelectLabel>
                        {ETATS_VIE.map((e) => (
                          <SelectItem key={e.value} value={e.value}>
                            {e.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted">
                  Joueur
                </label>
                <Input
                  value={form.joueur}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, joueur: e.target.value }))
                  }
                  placeholder={
                    isEdit ? (character?.player?.pseudo ?? "—") : "Pseudo du joueur"
                  }
                  list="suggest-joueurs"
                />
                <datalist id="suggest-joueurs">
                  {playerPseudos.map((pseudo) => (
                    <option key={pseudo} value={pseudo} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted">
                  Version
                </label>
                <Select
                  value={form.versionId}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, versionId: v ?? "" }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Aucune" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Version</SelectLabel>
                      {versions.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.id} — {v.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted">
                  Lien Reddif
                </label>
                <Input
                  value={form.lienReddif}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, lienReddif: e.target.value }))
                  }
                  placeholder={
                    isEdit
                      ? (character?.lienReddif ?? "https://youtube.com/...")
                      : "https://youtube.com/..."
                  }
                />
              </div>

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
                  Note (relations, localisation, etc — optionnel)
                </label>
                <textarea
                  className="h-16 resize-none rounded-md px-3 py-2 bg-input border border-border text-[13px]"
                  value={form.note}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, note: e.target.value }))
                  }
                  placeholder="Relations, localisation, précisions…"
                />
              </div>

              <div>
                <p className="text-sm text-text-muted">
                  Vous pouvez envoyer les images de personnage ici :{" "}
                  <a
                    href="https://discord.gg/eyStpqcYwa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    https://discord.gg/eyStpqcYwa
                  </a>
                </p>
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
