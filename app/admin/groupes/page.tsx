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
import { Groupe } from "@/lib/db";
import { useEffect, useState } from "react";

type GroupeForm = {
  slug: string;
  nom: string;
  description: string;
  color: string;
  imageUrl: string;
};

const EMPTY_FORM: GroupeForm = {
  slug: "",
  nom: "",
  description: "",
  color: "",
  imageUrl: "",
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

export default function GroupesPage() {
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [modal, setModal] = useState<"form" | "delete" | null>(null);
  const [selected, setSelected] = useState<Groupe | null>(null);
  const [form, setForm] = useState<GroupeForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const isEdit = !!selected;

  async function load() {
    const data = await fetch("/api/groupes").then((r) => r.json());
    setGroupes(data ?? []);
  }

  useEffect(() => {
    fetch("/api/groupes")
      .then((r) => r.json())
      .then((data) => setGroupes(data ?? []));
  }, []);

  function openAdd() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setModal("form");
  }

  function openEdit(g: Groupe) {
    setSelected(g);
    setForm({
      slug: g.slug,
      nom: g.nom,
      description: g.description ?? "",
      color: g.color ?? "",
      imageUrl: g.imageUrl ?? "",
    });
    setModal("form");
  }

  function openDelete(g: Groupe) {
    setSelected(g);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setForm(EMPTY_FORM);
  }

  const handleNomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nom = e.target.value;
    setForm((p) => ({ ...p, nom, slug: !isEdit ? slugify(nom) : p.slug }));
  };

  async function submit() {
    setLoading(true);
    const body = {
      slug: form.slug,
      nom: form.nom,
      description: form.description || null,
      color: form.color || null,
      image_url: form.imageUrl || null,
    };

    if (isEdit) {
      await fetch("/api/groupes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected!.id, ...body }),
      });
    } else {
      await fetch("/api/groupes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    await load();
    closeModal();
    setLoading(false);
  }

  async function confirmDelete() {
    if (!selected) return;
    await fetch("/api/groupes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id }),
    });
    await load();
    closeModal();
  }

  const filtered = groupes.filter((g) =>
    g.nom.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-text-primary">
            Groupes
          </h1>
          <p className="text-[11px] text-text-muted mt-0.5">
            Gérer les groupes de personnages
          </p>
        </div>
      </div>

      <div className="flex-1 p-6">
        {/* Barre filtres */}
        <div className="flex items-center gap-2 mb-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="h-7 text-[11px] w-48 bg-elevated border-border-mid"
          />
          <span className="text-[11px] text-text-muted bg-elevated border border-border px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
          <div className="flex-1" />
          <Button size="sm" onClick={openAdd}>
            + Ajouter
          </Button>
        </div>

        {/* Liste */}
        <div className="flex flex-col gap-3">
          {filtered.map((g) => (
            <Card key={g.id}>
              <CardContent className="flex items-center gap-3">
                {g.color && (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: g.color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-primary">
                      {g.nom}
                    </span>
                    <span className="text-[10px] text-text-muted bg-elevated px-1.5 py-0.5 rounded border border-border">
                      /{g.slug}
                    </span>
                  </div>
                  {g.description && (
                    <p className="text-[11px] text-text-secondary mt-0.5 truncate">
                      {g.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(g)}
                    className="text-[11px] text-text-muted hover:text-accent-light px-2 py-1 rounded hover:bg-elevated transition-colors cursor-pointer"
                  >
                    Éditer
                  </button>
                  <button
                    onClick={() => openDelete(g)}
                    className="text-[11px] text-text-muted hover:text-[#f87171] px-2 py-1 rounded hover:bg-[#2e1010] transition-colors cursor-pointer"
                  >
                    Supprimer
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-[12px] text-text-muted py-8">
              Aucun groupe
            </p>
          )}
        </div>
      </div>

      {/* Modal form */}
      <Dialog open={modal === "form"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="bg-card border-border-mid max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px] tracking-wide">
              {isEdit ? "Modifier le groupe" : "Nouveau groupe"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Field label="Nom">
              <Input
                value={form.nom}
                onChange={handleNomChange}
                placeholder="Requiem"
              />
            </Field>
            <Field label="Slug (URL)">
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder="requiem"
              />
            </Field>
            <Field label="Description">
              <textarea
                className="h-16 resize-none rounded-md px-3 py-2 bg-input border border-border text-[13px]"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Description du groupe…"
              />
            </Field>
            <Field label="Couleur">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color || "#8880a8"}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, color: e.target.value }))
                  }
                  className="h-8 w-8 rounded cursor-pointer border border-border bg-transparent"
                />
                <Input
                  value={form.color}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, color: e.target.value }))
                  }
                  placeholder="#8880a8"
                  className="flex-1"
                />
              </div>
            </Field>
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
              disabled={loading || !form.nom || !form.slug}
              className="flex-1 text-[12px] bg-accent hover:bg-accent-hover text-white border-0 cursor-pointer"
            >
              {loading ? "…" : isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal delete */}
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
            Supprimer &quot;{selected?.nom}&quot; ? Les personnages de ce groupe
            ne seront pas supprimés.
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
