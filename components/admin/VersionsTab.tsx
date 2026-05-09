"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Version } from "@/lib/db";
import { authHeaders } from "@/lib/utils";
import { useEffect, useState } from "react";

type Props = { token: string };

type VersionForm = {
  id: string;
  label: string;
  description: string;
  color: string;
};

const cls =
  "h-8 text-[12px] bg-[var(--elevated)] border-[var(--border-mid)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-0 placeholder:text-[var(--text-muted)]";

export function VersionsTab({ token }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Version | null>(null);
  const [form, setForm] = useState<VersionForm>({
    id: "",
    label: "",
    description: "",
    color: "#a78bfa",
  });
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/data");
    const data = await res.json();
    setVersions(data.versions ?? []);
  }
  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  function set(field: keyof VersionForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function openAdd() {
    setForm({ id: "", label: "", description: "", color: "#a78bfa" });
    setModal("add");
  }
  function openEdit(v: Version) {
    setSelected(v);
    setForm({
      id: v.id,
      label: v.label,
      description: v.description ?? "",
      color: v.color ?? "#a78bfa",
    });
    setModal("edit");
  }
  function openDelete(v: Version) {
    setSelected(v);
    setModal("delete");
  }
  function closeModal() {
    setModal(null);
  }

  async function submit() {
    setLoading(true);
    const body = {
      label: form.label,
      description: form.description || null,
      color: form.color,
    };
    if (modal === "add") {
      await fetch("/api/versions", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ id: form.id, ...body }),
      });
    } else if (modal === "edit" && selected) {
      await fetch("/api/versions", {
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
    await fetch("/api/versions", {
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
          <h2 className="text-[15px] font-bold tracking-wide text-[var(--text-primary)]">
            Versions
          </h2>
          <span className="text-[11px] text-[var(--text-muted)] bg-[var(--elevated)] border border-[var(--border)] px-2 py-0.5 rounded-full">
            {versions.length}
          </span>
        </div>
        <Button
          size="sm"
          onClick={openAdd}
          className="h-7 text-[11px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-0 cursor-pointer"
        >
          + Ajouter
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {versions.map((v) => (
          <Card
            key={v.id}
            className="bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-mid)] transition-colors"
            style={{
              borderTopWidth: 2,
              borderTopColor: v.color ?? "var(--accent)",
            }}
          >
            <CardHeader className="pb-1 pt-3 px-4">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-bold"
                  style={{
                    color: v.color,
                    borderColor: `${v.color}40`,
                    background: `${v.color}18`,
                  }}
                >
                  {v.id}
                </Badge>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(v)}
                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-light)] px-1.5 py-0.5 rounded hover:bg-[var(--elevated)] cursor-pointer"
                  >
                    Éditer
                  </button>
                  <button
                    onClick={() => openDelete(v)}
                    className="text-[10px] text-[var(--text-muted)] hover:text-[#f87171] px-1.5 py-0.5 rounded hover:bg-[#2e1010] cursor-pointer"
                  >
                    Suppr.
                  </button>
                </div>
              </div>
              <CardTitle className="text-[13px] font-semibold text-[var(--text-primary)] mt-1">
                {v.label}
              </CardTitle>
            </CardHeader>
            {v.description && (
              <CardContent className="px-4 pb-3 pt-0">
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                  {v.description}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Modal add/edit */}
      <Dialog
        open={modal === "add" || modal === "edit"}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent className="bg-[var(--card)] border-[var(--border-mid)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px] tracking-wide text-[var(--text-primary)]">
              {modal === "edit" ? "Modifier la version" : "Nouvelle version"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                ID (ex: V7)
              </label>
              <Input
                className={cls}
                value={form.id}
                onChange={set("id")}
                placeholder="V7"
                disabled={modal === "edit"}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Label
              </label>
              <Input
                className={cls}
                value={form.label}
                onChange={set("label")}
                placeholder="Version 7 — Renouveau"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Description
              </label>
              <textarea
                className={`${cls} h-16 resize-none rounded-md px-3 py-2`}
                value={form.description}
                onChange={set("description")}
                placeholder="Contexte de cette version du serveur…"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Couleur
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={set("color")}
                  className="w-8 h-8 rounded cursor-pointer border border-[var(--border-mid)] bg-transparent"
                />
                <Input
                  className={`${cls} flex-1`}
                  value={form.color}
                  onChange={set("color")}
                  placeholder="#a78bfa"
                />
                <div
                  className="w-8 h-8 rounded-lg border flex-shrink-0"
                  style={{
                    background: `${form.color}18`,
                    borderColor: `${form.color}40`,
                  }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:flex-row pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={closeModal}
              className="flex-1 text-[12px] border-[var(--border-mid)] text-[var(--text-secondary)] cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={loading}
              className="flex-1 text-[12px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-0 cursor-pointer"
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
        <DialogContent className="bg-[var(--card)] border-[var(--border-mid)] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[14px] tracking-wide text-[var(--text-primary)]">
              Confirmation
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Supprimer la version &quot;{selected?.label}&quot; ?
          </p>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={closeModal}
              className="flex-1 border-[var(--border-mid)] text-[var(--text-secondary)] cursor-pointer"
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
