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
import { Character, Player, Version } from "@/lib/db";
import { statusBadgeClass } from "@/lib/utils";
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
import { CharacterCombobox } from "./CharacterCombobox";
import { PlayerCombobox } from "./PlayerCombobox";

type Props = { players: Player[]; versions: Version[] };

type CharForm = {
  nom: string;
  metier: string;
  description: string;
  playerId: string;
  versionId: string;
  role: string;
  lienReddif: string;
};

type PendingRelation = {
  personnage_b: string;
  type_relation: string | null;
  linked: Character | undefined;
};

const ROLES = [
  { label: "Civil", value: "civil" },
  { label: "Illégal", value: "illegal" },
];

const EMPTY_FORM: CharForm = {
  nom: "",
  metier: "",
  description: "",
  playerId: "",
  versionId: "",
  role: "civil",
  lienReddif: "",
};

function charToForm(c: Character): CharForm {
  return {
    nom: c.nom,
    metier: c.metier ?? "",
    description: c.description ?? "",
    playerId: c.playerId ?? "",
    versionId: c.versionId ?? "",
    role: c.role ?? "civil",
    lienReddif: c.lienReddif ?? "",
  };
}

export function CharactersTab({ players, versions }: Props) {
  const [chars, setChars] = useState<Character[]>([]);
  const [modal, setModal] = useState<"form" | "delete" | null>(null);
  const [selected, setSelected] = useState<Character | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [activeRelations, setActiveRelations] = useState<
    NonNullable<Character["relations"]>
  >([]);
  const [pendingRelations, setPendingRelations] = useState<PendingRelation[]>(
    [],
  );
  const [form, setForm] = useState<CharForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);

  const [newRelPerso, setNewRelPerso] = useState("");
  const [newRelType, setNewRelType] = useState("");
  const [relLoading, setRelLoading] = useState(false);

  const [search, setSearch] = useState("");

  const filtered = chars.filter((c) =>
    [c.nom, c.metier, c.player?.pseudo]
      .filter(Boolean)
      .some((s) => s!.toLowerCase().includes(search.toLowerCase())),
  );

  const isEdit = !!selected;
  const activeId = selected?.id ?? createdId;
  type DisplayRelation = {
    id: string;
    linked:
      | NonNullable<Character["relations"]>[number]["linked"]
      | PendingRelation["linked"];
    type_relation: string | null;
  };

  // Relations à afficher : soit les vraies (edit/après création), soit les pending (avant création)
  const displayRelations: DisplayRelation[] = activeId
    ? activeRelations.map((r) => ({
        id: r.id,
        linked: r.linked,
        type_relation: r.type_relation,
      }))
    : pendingRelations.map((r, i) => ({
        id: `pending-${i}`,
        linked: r.linked,
        type_relation: r.type_relation,
      }));

  async function load(refreshActiveId?: string) {
    const res = await fetch("/api/data");
    const data = await res.json();
    const characters: Character[] = data.characters ?? [];
    setChars(characters);
    setLocalPlayers(data.players ?? []);
    if (refreshActiveId) {
      setActiveRelations(
        characters.find((c) => c.id === refreshActiveId)?.relations ?? [],
      );
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/data");
        const data = await res.json();
        if (mounted) {
          setChars(data.characters ?? []);
          setLocalPlayers(data.players ?? []);
        }
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
    setSelected(null);
    setCreatedId(null);
    setActiveRelations([]);
    setPendingRelations([]);
    setForm(EMPTY_FORM);
    setNewRelPerso("");
    setNewRelType("");
    setModal("form");
  }

  function openEdit(c: Character) {
    setSelected(c);
    setCreatedId(null);
    setActiveRelations(c.relations ?? []);
    setPendingRelations([]);
    setForm(charToForm(c));
    setNewRelPerso("");
    setNewRelType("");
    setModal("form");
  }

  function openDelete(c: Character) {
    setSelected(c);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setCreatedId(null);
    setActiveRelations([]);
    setPendingRelations([]);
  }

  async function submit() {
    setLoading(true);
    const body = {
      nom: form.nom,
      metier: form.metier || null,
      description: form.description || null,
      player_id: form.playerId || null,
      version_id: form.versionId || null,
      role: form.role || null,
      lien_reddif: form.lienReddif || null,
    };
    const headers = { "Content-Type": "application/json" };

    if (!isEdit) {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const newChar = await res.json();

      // Envoyer les relations en attente
      await Promise.all(
        pendingRelations.map((r) =>
          fetch("/api/relations", {
            method: "POST",
            headers,
            body: JSON.stringify({
              personnage_a: newChar.id,
              personnage_b: r.personnage_b,
              type_relation: r.type_relation,
            }),
          }),
        ),
      );

      setPendingRelations([]);
      setCreatedId(newChar.id);
      await load(newChar.id);
      setLoading(false);
      return;
    }

    await fetch("/api/characters", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id: selected.id, ...body }),
    });
    await load();
    setLoading(false);
    closeModal();
  }

  async function confirmDelete() {
    if (!selected) return;
    await fetch("/api/characters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id }),
    });
    await load();
    closeModal();
  }

  async function addRelation() {
    if (!newRelPerso) return;

    if (!activeId) {
      // Personnage pas encore créé : stocker en local
      const linked = chars.find((c) => c.id === newRelPerso);
      setPendingRelations((prev) => [
        ...prev,
        {
          personnage_b: newRelPerso,
          type_relation: newRelType || null,
          linked,
        },
      ]);
      setNewRelPerso("");
      setNewRelType("");
      return;
    }

    // Personnage déjà en base : appel API direct
    setRelLoading(true);
    await fetch("/api/relations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personnage_a: activeId,
        personnage_b: newRelPerso,
        type_relation: newRelType || null,
      }),
    });
    await load(activeId);
    setNewRelPerso("");
    setNewRelType("");
    setRelLoading(false);
  }

  async function deleteRelation(id: string) {
    if (id.startsWith("pending-")) {
      const idx = parseInt(id.replace("pending-", ""));
      setPendingRelations((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    await fetch("/api/relations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load(activeId ?? undefined);
  }

  const sharedForm = (
    <div className="flex flex-col gap-3">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-text-muted">
            Rôle
          </label>
          <Select
            value={form.role}
            onValueChange={(v) => setForm((f) => ({ ...f, role: v ?? "" }))}
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
            key={`${modal}-${selected?.id ?? createdId ?? "new"}`}
            players={localPlayers}
            value={form.playerId}
            onValueChange={(v, newPlayer) => {
              setForm((f) => ({ ...f, playerId: v }));
              if (newPlayer) setLocalPlayers((p) => [...p, newPlayer]);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-widest text-text-muted">
          Version
        </label>
        <Select
          value={form.versionId}
          onValueChange={(v) => setForm((f) => ({ ...f, versionId: v ?? "" }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Aucune" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Version</SelectLabel>
              <SelectItem value="">Aucune</SelectItem>
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
          Description
        </label>
        <textarea
          className="h-16 resize-none rounded-md px-3 py-2 bg-input border border-border text-[13px]"
          value={form.description}
          onChange={set("description")}
          placeholder="Courte biographie…"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-widest text-text-muted">
          Lien Reddif
        </label>
        <Input
          value={form.lienReddif}
          onChange={set("lienReddif")}
          placeholder="https://youtube.com/..."
        />
      </div>

      {/* Relations — toujours visibles */}
      <div className="border-t border-border pt-3 flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">
          Relations ({displayRelations.length})
          {!activeId && pendingRelations.length > 0 && (
            <span className="ml-2 text-[9px] text-text-muted normal-case tracking-normal">
              — seront enregistrées à la création
            </span>
          )}
        </p>

        {displayRelations.length > 0 && (
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
            {displayRelations.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border ${
                  r.id.startsWith("pending-")
                    ? "bg-elevated/50 border-border border-dashed"
                    : "bg-elevated border-border"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[12px] font-medium text-text-primary truncate">
                    {r.linked?.nom}
                  </span>
                  {r.type_relation && (
                    <span className="text-[10px] text-text-muted shrink-0">
                      — {r.type_relation}
                    </span>
                  )}
                  {r.id.startsWith("pending-") && (
                    <span className="text-[9px] text-text-muted shrink-0 italic">
                      en attente
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteRelation(r.id)}
                  className="text-[10px] text-text-muted hover:text-[#f87171] px-1.5 py-0.5 rounded hover:bg-[#2e1010] transition-colors cursor-pointer shrink-0 ml-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-widest text-text-muted">
              Personnage
            </label>
            <CharacterCombobox
              key={`rel-${activeId ?? "new"}`}
              characters={chars}
              value={newRelPerso}
              onValueChange={(v) => setNewRelPerso(v)}
              excludeId={activeId ?? undefined}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-widest text-text-muted">
              Type (optionnel)
            </label>
            <Input
              value={newRelType}
              onChange={(e) => setNewRelType(e.target.value)}
              placeholder="Frère, Associé…"
              className="h-9 text-[12px]"
            />
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={addRelation}
          disabled={relLoading || !newRelPerso}
          className="text-[11px] border-border-mid text-text-secondary cursor-pointer"
        >
          {relLoading ? "…" : "+ Ajouter la relation"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold tracking-wide text-text-primary">
            Personnages
          </h2>
          <span className="text-[11px] text-text-muted bg-elevated border border-border px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="h-7 text-[11px] w-36 bg-elevated border-border-mid"
          />
          <Button size="sm" onClick={openAdd}>
            + Ajouter
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {chars.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold border shrink-0 bg-elevated border-border text-text-secondary">
                {c.nom.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-text-primary truncate">
                    {c.nom}
                  </span>
                  {c.role && (
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${statusBadgeClass(c.role)}`}
                    >
                      {ROLES.find((r) => r.value === c.role)?.label ?? c.role}
                    </span>
                  )}
                  {c.version && (
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border"
                      style={{
                        color: c.version.color ?? "var(--accent)",
                        borderColor: `${c.version.color ?? "var(--accent)"}40`,
                        background: `${c.version.color ?? "var(--accent)"}18`,
                      }}
                    >
                      {c.version.id}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {c.metier && (
                    <span className="text-[11px] text-text-secondary truncate">
                      {c.metier}
                    </span>
                  )}
                  {c.metier && c.player && (
                    <span className="text-text-muted">·</span>
                  )}
                  {c.player && (
                    <span className="text-[10px] text-text-muted">
                      @{c.player.pseudo}
                    </span>
                  )}
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

      <Dialog open={modal === "form"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="bg-card border-border-mid max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[14px] tracking-wide">
              {isEdit ? "Modifier le personnage" : "Nouveau personnage"}
            </DialogTitle>
          </DialogHeader>

          {sharedForm}

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
              onClick={createdId ? closeModal : submit}
              disabled={loading || !form.nom}
              className="flex-1 text-[12px] bg-accent hover:bg-accent-hover text-white border-0 cursor-pointer"
            >
              {loading
                ? "…"
                : createdId
                  ? "Terminer"
                  : isEdit
                    ? "Enregistrer"
                    : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
