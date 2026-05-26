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
import { CldUploadWidget } from "next-cloudinary";
import dynamic from "next/dynamic";
import Image from "next/image";
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

const AdminLocationPicker = dynamic(
  () => import("@/components/admin/AdminLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-100 bg-elevated rounded-lg animate-pulse" />
    ),
  },
);

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = { players: Player[]; versions: Version[] };
type ModalTab = "infos" | "localisation";
type CharForm = {
  nom: string;
  metier: string;
  groupe: string;
  description: string;
  playerId: string;
  versionId: string;
  role: string;
  lienReddif: string;
  imageUrl?: string;
};
type PendingRelation = {
  personnage_b: string;
  type_relation: string | null;
  type_relation_inverse: string | null;
  linked: Character | undefined;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLES = [
  { label: "Civil", value: "civil" },
  { label: "Illégal", value: "illegal" },
];
const EMPTY_FORM: CharForm = {
  nom: "",
  metier: "",
  groupe: "",
  description: "",
  playerId: "",
  versionId: "",
  role: "civil",
  lienReddif: "",
  imageUrl: "",
};
const charToForm = (c: Character): CharForm => ({
  nom: c.nom,
  metier: c.metier ?? "",
  groupe: c.groupe ?? "",
  description: c.description ?? "",
  playerId: c.playerId ?? "",
  versionId: c.versionId ?? "",
  role: c.role ?? "civil",
  lienReddif: c.lienReddif ?? "",
  imageUrl: c.imageUrl ?? "",
});

// ─── Small helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-widest text-text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function SimpleSelect({
  value,
  onValueChange,
  placeholder,
  label,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? "")}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {children}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CharactersTab({ players, versions }: Props) {
  const [chars, setChars] = useState<Character[]>([]);
  const [modal, setModal] = useState<"form" | "delete" | null>(null);
  const [modalTab, setModalTab] = useState<ModalTab>("infos");
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
  const [newRelTypeInverse, setNewRelTypeInverse] = useState("");
  const [relLoading, setRelLoading] = useState(false);
  const [search, setSearch] = useState("");

  const isEdit = !!selected;
  const activeId = selected?.id ?? createdId;
  const activeChar =
    selected ?? (createdId ? chars.find((c) => c.id === createdId) : null);
  const filtered = chars.filter((c) =>
    [c.nom, c.metier, c.player?.pseudo]
      .filter(Boolean)
      .some((s) => s!.toLowerCase().includes(search.toLowerCase())),
  );

  type DR = {
    id: string;
    linked: Character | undefined;
    type_relation: string | null;
  };
  const displayRelations: DR[] = activeId
    ? activeRelations.map((r) => ({
        id: r.id,
        linked: r.linked as unknown as DR["linked"],
        type_relation: r.type_relation,
      }))
    : pendingRelations.map((r, i) => ({
        id: `pending-${i}`,
        linked: r.linked as unknown as DR["linked"],
        type_relation: r.type_relation,
      }));

  // ─── Data ──────────────────────────────────────────────────────────────────

  async function load(refreshId?: string) {
    const data = await fetch("/api/data").then((r) => r.json());
    const characters: Character[] = data.characters ?? [];
    setChars(characters);
    setLocalPlayers(data.players ?? []);
    if (refreshId)
      setActiveRelations(
        characters.find((c) => c.id === refreshId)?.relations ?? [],
      );
  }

  useEffect(() => {
    let ok = true;
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        if (ok) {
          setChars(d.characters ?? []);
          setLocalPlayers(d.players ?? []);
        }
      })
      .catch(console.error);
    return () => {
      ok = false;
    };
  }, []);

  // ─── Modal helpers ─────────────────────────────────────────────────────────

  const resetRel = () => {
    setNewRelPerso("");
    setNewRelType("");
    setNewRelTypeInverse("");
  };

  function openAdd() {
    setSelected(null);
    setCreatedId(null);
    setActiveRelations([]);
    setPendingRelations([]);
    setForm(EMPTY_FORM);
    resetRel();
    setModalTab("infos");
    setModal("form");
  }
  function openEdit(c: Character) {
    setSelected(c);
    setCreatedId(null);
    setActiveRelations(c.relations ?? []);
    setPendingRelations([]);
    setForm(charToForm(c));
    resetRel();
    setModalTab("infos");
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
    resetRel();
    setModalTab("infos");
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  const apiHeaders = { "Content-Type": "application/json" };
  const bodyFromForm = () => ({
    nom: form.nom,
    metier: form.metier || null,
    groupe: form.groupe || null,
    description: form.description || null,
    player_id: form.playerId || null,
    version_id: form.versionId || null,
    role: form.role || null,
    lien_reddif: form.lienReddif || null,
    image_url: form.imageUrl || null,
  });

  async function submit() {
    setLoading(true);
    if (!isEdit) {
      const newChar = await fetch("/api/characters", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify(bodyFromForm()),
      }).then((r) => r.json());
      await Promise.all(
        pendingRelations.map((r) =>
          fetch("/api/relations", {
            method: "POST",
            headers: apiHeaders,
            body: JSON.stringify({
              personnage_a: newChar.id,
              personnage_b: r.personnage_b,
              type_relation: r.type_relation,
              type_relation_inverse: r.type_relation_inverse,
            }),
          }),
        ),
      );
      setPendingRelations([]);
      setCreatedId(newChar.id);
      await load(newChar.id);
    } else {
      await fetch("/api/characters", {
        method: "PATCH",
        headers: apiHeaders,
        body: JSON.stringify({ id: selected.id, ...bodyFromForm() }),
      });
      await load();
      closeModal();
    }
    setLoading(false);
  }

  async function confirmDelete() {
    if (!selected) return;
    await fetch("/api/characters", {
      method: "DELETE",
      headers: apiHeaders,
      body: JSON.stringify({ id: selected.id }),
    });
    await load();
    closeModal();
  }

  async function addRelation() {
    if (!newRelPerso) return;
    if (!activeId) {
      setPendingRelations((p) => [
        ...p,
        {
          personnage_b: newRelPerso,
          type_relation: newRelType || null,
          type_relation_inverse: newRelTypeInverse || null,
          linked: chars.find((c) => c.id === newRelPerso),
        },
      ]);
      resetRel();
      return;
    }
    setRelLoading(true);
    await fetch("/api/relations", {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        personnage_a: activeId,
        personnage_b: newRelPerso,
        type_relation: newRelType || null,
        type_relation_inverse: newRelTypeInverse || null,
      }),
    });
    await load(activeId);
    resetRel();
    setRelLoading(false);
  }

  async function deleteRelation(id: string) {
    if (id.startsWith("pending-")) {
      setPendingRelations((p) =>
        p.filter((_, i) => i !== parseInt(id.replace("pending-", ""))),
      );
      return;
    }
    await fetch("/api/relations", {
      method: "DELETE",
      headers: apiHeaders,
      body: JSON.stringify({ id }),
    });
    await load(activeId ?? undefined);
  }

  async function patchLocation(x: number | null, y: number | null) {
    await fetch(`/api/characters/${activeId}/location`, {
      method: "PATCH",
      headers: apiHeaders,
      body: JSON.stringify({ x, y }),
    });
    await load(activeId ?? undefined);
  }

  const f =
    (field: keyof CharForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ─── Tab content ───────────────────────────────────────────────────────────

  const otherPerso = chars.find((c) => c.id === newRelPerso);

  const infosTab = (
    <div className="flex flex-col gap-3">
      <Field label="Nom">
        <Input value={form.nom} onChange={f("nom")} placeholder="Tony Mercer" />
      </Field>
      <Field label="Métier">
        <Input
          value={form.metier}
          onChange={f("metier")}
          placeholder="Mécanicien, Avocat…"
        />
      </Field>
      <Field label="Groupe">
        <Input
          value={form.groupe}
          onChange={f("groupe")}
          placeholder="Los Santos MC, Mafia…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Rôle">
          <SimpleSelect
            value={form.role}
            onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}
            placeholder="Rôle"
            label="Rôle"
          >
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SimpleSelect>
        </Field>
        <Field label="Joueur">
          <PlayerCombobox
            key={`${modal}-${selected?.id ?? createdId ?? "new"}`}
            players={localPlayers}
            value={form.playerId}
            onValueChange={(v, np) => {
              setForm((p) => ({ ...p, playerId: v }));
              if (np) setLocalPlayers((p) => [...p, np]);
            }}
          />
        </Field>
      </div>

      <Field label="Version">
        <SimpleSelect
          value={form.versionId}
          onValueChange={(v) => setForm((p) => ({ ...p, versionId: v }))}
          placeholder="Aucune"
          label="Version"
        >
          <SelectItem value="">Aucune</SelectItem>
          {versions.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.id} — {v.label}
            </SelectItem>
          ))}
        </SimpleSelect>
      </Field>

      <Field label="Description">
        <textarea
          className="h-16 resize-none rounded-md px-3 py-2 bg-input border border-border text-[13px]"
          value={form.description}
          onChange={f("description")}
          placeholder="Courte biographie…"
        />
      </Field>

      <Field label="Image">
        <div className="flex items-center gap-2">
          {form.imageUrl ? (
            <Image
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_40,h_40,c_fill,g_face/${form.imageUrl}`}
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
              alt="aperçu"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg border border-border border-dashed bg-elevated flex items-center justify-center shrink-0">
              <span className="text-[16px] text-text-muted">🖼</span>
            </div>
          )}
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
            onSuccess={(result) => {
              const info = result?.info;
              const publicId =
                typeof info === "object" && info && "public_id" in info
                  ? (info.public_id as string)
                  : "";
              setForm((p) => ({ ...p, imageUrl: publicId }));
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="text-[11px] border border-border-mid text-text-secondary px-3 py-1.5 rounded-md hover:bg-elevated transition-colors cursor-pointer"
              >
                {form.imageUrl ? "Changer" : "Uploader"}
              </button>
            )}
          </CldUploadWidget>
          {form.imageUrl && (
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
              className="text-[10px] text-text-muted hover:text-[#f87171] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </Field>

      <Field label="Lien Reddif">
        <Input
          value={form.lienReddif}
          onChange={f("lienReddif")}
          placeholder="https://youtube.com/..."
        />
      </Field>

      {/* Relations */}
      <div className="border-t border-border pt-3 flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">
          Relations ({displayRelations.length})
          {!activeId && pendingRelations.length > 0 && (
            <span className="ml-2 text-[9px] normal-case tracking-normal">
              — seront enregistrées à la création
            </span>
          )}
        </p>

        {displayRelations.length > 0 && (
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
            {displayRelations.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border ${r.id.startsWith("pending-") ? "bg-elevated/50 border-dashed border-border" : "bg-elevated border-border"}`}
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

        <Field label="Personnage">
          <CharacterCombobox
            key={`rel-${activeId ?? "new"}`}
            characters={chars}
            value={newRelPerso}
            onValueChange={setNewRelPerso}
            excludeId={activeId ?? undefined}
          />
        </Field>

        {(["inverse", "direct"] as const).map((dir) => {
          const isInverse = dir === "inverse";
          return (
            <div
              key={dir}
              className="flex items-center gap-1.5 flex-wrap text-[12px] text-text-secondary"
            >
              <span className="shrink-0 font-medium text-text-primary">
                {isInverse
                  ? form.nom || "Ce personnage"
                  : otherPerso?.nom || "L'autre"}
              </span>
              <span className="shrink-0">est</span>
              <Input
                value={isInverse ? newRelTypeInverse : newRelType}
                onChange={(e) =>
                  isInverse
                    ? setNewRelTypeInverse(e.target.value)
                    : setNewRelType(e.target.value)
                }
                placeholder={isInverse ? "frère…" : "sœur…"}
                className="h-7 text-[12px] w-24 px-2"
              />
              <span className="shrink-0">de</span>
              <span className="shrink-0 font-medium text-text-primary">
                {isInverse
                  ? otherPerso?.nom || "___"
                  : form.nom || "ce personnage"}
              </span>
            </div>
          );
        })}

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

  const localisationTab = !activeId ? (
    <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
      <span className="text-2xl">📍</span>
      <p className="text-[13px] text-text-secondary">
        Créez d&apos;abord le personnage pour pouvoir lui assigner une
        localisation.
      </p>
      <Button
        size="sm"
        onClick={submit}
        disabled={loading || !form.nom}
        className="mt-2 text-[12px] bg-accent hover:bg-accent-hover text-white border-0 cursor-pointer"
      >
        {loading ? "…" : "Créer le personnage"}
      </Button>
    </div>
  ) : (
    <AdminLocationPicker
      key={activeId ?? "new"}
      characterId={activeId}
      characterName={activeChar?.nom ?? form.nom}
      initialX={activeChar?.locationX ?? null}
      initialY={activeChar?.locationY ?? null}
      imageUrl={activeChar?.imageUrl ?? form.imageUrl}
      onSave={(x, y) => patchLocation(x, y)}
      onClear={() => patchLocation(null, null)}
    />
  );

  // ─── Render ────────────────────────────────────────────────────────────────

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
        {filtered.map((c) => (
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
                  {"locationX" in c &&
                    (c as { locationX?: number | null }).locationX != null && (
                      <span
                        className="text-[9px] text-text-muted"
                        title="Localisé sur la carte"
                      >
                        📍
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
          <div className="flex gap-1 border-b border-border mb-1">
            {(["infos", "localisation"] as ModalTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setModalTab(tab)}
                className={`text-[11px] px-3 py-1.5 rounded-t transition-colors cursor-pointer ${modalTab === tab ? "text-text-primary border-b-2 border-accent -mb-px" : "text-text-muted hover:text-text-secondary"}`}
              >
                {tab === "infos" ? "Infos" : "📍 Localisation"}
              </button>
            ))}
          </div>
          {modalTab === "infos" ? infosTab : localisationTab}
          <DialogFooter className="flex gap-2 sm:flex-row pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={closeModal}
              className="flex-1 text-[12px] border-border-mid text-text-secondary cursor-pointer"
            >
              Annuler
            </Button>
            {modalTab === "infos" && (
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
            )}
            {modalTab === "localisation" && activeId && (
              <Button
                size="sm"
                onClick={closeModal}
                className="flex-1 text-[12px] bg-accent hover:bg-accent-hover text-white border-0 cursor-pointer"
              >
                Terminer
              </Button>
            )}
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
