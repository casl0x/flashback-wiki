"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Character, Player } from "@/lib/db";
import { authHeaders, statusBadgeClass } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PlayerCombobox } from "./PlayerCombobox";

type Props = { token: string; players: Player[] };

type CharForm = {
  nom: string;
  metier: string;
  description: string;
  player_id: string;
  role: string | null;
  lien_reddit: string;
};

const ROLES = [
  { label: "Civil", value: "civil" },
  { label: "Illégal", value: "illegal" },
];

export function CharactersTab({ token, players }: Props) {
  const [chars, setChars] = useState<Character[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Character | null>(null);
  const [form, setForm] = useState<CharForm>({
    nom: "",
    metier: "",
    description: "",
    player_id: "",
    role: "",
    lien_reddit: "",
  });
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/data");
    const data = await res.json();
    setChars(data.characters ?? []);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/data");
        const data = await res.json();
        if (mounted) setChars(data.characters ?? []);
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function set(field: keyof CharForm) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function openAdd() {
    setForm({
      nom: "",
      metier: "",
      description: "",
      player_id: String(players[0]?.id ?? ""),
      role: "civil",
      lien_reddit: "",
    });
    setModal("add");
  }

  function openEdit(c: Character) {
    setSelected(c);
    setForm({
      nom: c.nom,
      metier: c.metier ?? "",
      description: c.description ?? "",
      player_id: String(c.player_id),
      role: c.role ?? "",
      lien_reddit: c.lien_reddit ?? "",
    });
    setModal("edit");
  }

  function openDelete(c: Character) {
    setSelected(c);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
  }

  async function submit() {
    setLoading(true);
    const body = {
      ...form,
      role: form.role || null,
      lien_reddit: form.lien_reddit || null,
    };
    if (modal === "add") {
      await fetch("/api/characters", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
    } else if (modal === "edit" && selected) {
      await fetch("/api/characters", {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ id: selected.id, ...body }),
      });
    }
    await load();
    setLoading(false);
    closeModal();
  }

  async function confirmDelete() {
    if (!selected) return;
    await fetch("/api/characters", {
      method: "DELETE",
      headers: authHeaders(token),
      body: JSON.stringify({ id: selected.id }),
    });
    await load();
    closeModal();
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold tracking-wide text-text-primary">
            Personnages
          </h2>
          <span className="text-[11px] text-muted bg-elevated border border-border px-2 py-0.5 rounded-full">
            {chars.length}
          </span>
        </div>
        <Button size="sm" onClick={openAdd}>
          + Ajouter
        </Button>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-4">
        {chars.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold border shrink-0 bg-elevated border-border text-text-secondary">
                {c.nom.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-primary truncate">
                    {c.nom}
                  </span>
                  {c.role && (
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${statusBadgeClass(c.role)}`}
                    >
                      {ROLES.find((r) => r.value === c.role)?.label ?? c.role}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {c.metier && (
                    <span className="text-[11px] text-secondary truncate">
                      {c.metier}
                    </span>
                  )}
                  <span className="text-muted">·</span>
                  <span className="text-[10px] text-text-muted">
                    @{c.player?.pseudo}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(c)}
                  className="text-[11px] text-text-muted hover:text-accent-light px-2 py-1 rounded hover:bg-elevated transition-colors cursor-pointer"
                >
                  Éditer
                </button>
                <button
                  onClick={() => openDelete(c)}
                  className="text-[11px] text-text-muted hover:text-[#f87171] px-2 py-1 rounded hover:bg-[#2e1010] transition-colors cursor-pointer"
                >
                  Suppr.
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal add/edit */}
      <Dialog
        open={modal === "add" || modal === "edit"}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent className="bg-card border-mid max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px] tracking-wide">
              {modal === "edit"
                ? "Modifier le personnage"
                : "Nouveau personnage"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* Nom */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-text-muted">
                Nom
              </label>
              <Input
                value={form.nom}
                onChange={set("nom")}
                placeholder="Tony Mercer"
              />
            </div>

            {/* Métier */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-text-muted">
                Métier
              </label>
              <Input
                value={form.metier}
                onChange={set("metier")}
                placeholder="Mécanicien, Avocat…"
              />
            </div>

            {/* Rôle + Joueur */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted">
                  Rôle sur le plateau
                </label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
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
                  Joueur
                </label>
                <PlayerCombobox
                  players={players}
                  value={form.player_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, player_id: v }))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-text-muted">
                Description
              </label>
              <textarea
                className="h-16 resize-none rounded-md px-3 py-2 bg-input border border-border text-[13px]"
                value={form.description}
                onChange={set("description")}
                placeholder="Courte biographie…"
              />
            </div>

            {/* Lien Reddit */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-text-muted">
                Lien Reddit
              </label>
              <Input
                value={form.lien_reddit}
                onChange={set("lien_reddit")}
                placeholder="https://reddit.com/r/…"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:flex-row pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={closeModal}
              className="flex-1 text-[12px] border-border-mid text-text-secondary cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={loading}
              className="flex-1 text-[12px] bg-accent hover:bg-accent-hover text-white border-0 cursor-pointer"
            >
              {loading ? "…" : modal === "edit" ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <Dialog
        open={modal === "delete" && !!selected}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent className="bg-card border-border-mid max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[14px] tracking-wide">
              Confirmation
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-text-secondary">
            Supprimer &quot;{selected?.nom}&quot; ? Cette action est
            irréversible.
          </p>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={closeModal}
              className="flex-1 border-border-mid text-text-secondary cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={confirmDelete}
              className="flex-1 bg-[#2e1010] text-[#f87171] border border-[#4a1a1a] hover:bg-[#3a1414] cursor-pointer"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
