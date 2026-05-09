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
import { Player } from "@/lib/db";
import { authHeaders } from "@/lib/utils";
import { useEffect, useState } from "react";

type Props = { token: string };

type PlayerForm = {
  pseudo: string;
  discord: string;
  tiktok: string;
  stream_url: string;
};

const cls =
  "h-8 text-[12px] bg-(--elevated) border-(--border-mid) text-(--text-primary) focus:border-(--accent) focus:ring-0 placeholder:text-(--text-muted)";

export function PlayersTab({ token }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Player | null>(null);
  const [form, setForm] = useState<PlayerForm>({
    pseudo: "",
    discord: "",
    tiktok: "",
    stream_url: "",
  });
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/data");
    const data = await res.json();
    setPlayers(data.players ?? []);
  }
  useEffect(() => {
    // avoid calling setState synchronously inside an effect (can trigger cascading renders)
    const t = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function set(field: keyof PlayerForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function openAdd() {
    setForm({ pseudo: "", discord: "", tiktok: "", stream_url: "" });
    setModal("add");
  }
  function openEdit(p: Player) {
    setSelected(p);
    setForm({
      pseudo: p.pseudo,
      discord: p.discord ?? "",
      tiktok: p.tiktok ?? "",
      stream_url: p.stream_url ?? "",
    });
    setModal("edit");
  }
  function openDelete(p: Player) {
    setSelected(p);
    setModal("delete");
  }
  function closeModal() {
    setModal(null);
  }

  async function submit() {
    setLoading(true);
    const body = {
      pseudo: form.pseudo,
      discord: form.discord || null,
      tiktok: form.tiktok || null,
      stream_url: form.stream_url || null,
    };
    if (modal === "add") {
      await fetch("/api/players", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
    } else if (modal === "edit" && selected) {
      await fetch("/api/players", {
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
    await fetch("/api/players", {
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
          <h2 className="text-[15px] font-bold tracking-wide text-(--text-primary)">
            Joueurs
          </h2>
          <span className="text-[11px] text-(--text-muted) bg-(--elevated) border border-(--border) px-2 py-0.5 rounded-full">
            {players.length}
          </span>
        </div>
        <Button
          size="sm"
          onClick={openAdd}
          className="h-7 text-[11px] bg-(--accent) hover:bg-(--accent-hover) text-white border-0 cursor-pointer"
        >
          + Ajouter
        </Button>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-2">
        {players.map((p) => (
          <Card
            key={p.id}
            className="bg-(--card) border-(--border) hover:border-(--border-mid) transition-colors"
          >
            <CardContent className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-(--accent-bg) border border-(--border-accent) flex items-center justify-center text-[11px] font-bold text-(--accent-light) flex-shrink-0">
                {p.pseudo.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-(--text-primary)">
                  @{p.pseudo}
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  {p.discord && (
                    <span className="text-[10px] text-(--text-muted)">
                      Discord: {p.discord}
                    </span>
                  )}
                  {p.tiktok && (
                    <span className="text-[10px] text-(--text-muted)">
                      TikTok: {p.tiktok}
                    </span>
                  )}
                  {p.stream_url && (
                    <span className="text-[10px] text-(--text-muted) truncate max-w-[160px]">
                      {p.stream_url}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(p)}
                  className="text-[11px] text-(--text-muted) hover:text-(--accent-light) px-2 py-1 rounded hover:bg-(--elevated) transition-colors cursor-pointer"
                >
                  Éditer
                </button>
                <button
                  onClick={() => openDelete(p)}
                  className="text-[11px] text-(--text-muted) hover:text-[#f87171] px-2 py-1 rounded hover:bg-[#2e1010] transition-colors cursor-pointer"
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
        <DialogContent className="bg-(--card) border-(--border-mid) max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px] tracking-wide text-(--text-primary)">
              {modal === "edit" ? "Modifier le joueur" : "Nouveau joueur"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Pseudo
              </label>
              <Input
                className={cls}
                value={form.pseudo}
                onChange={set("pseudo")}
                placeholder="Jade_W"
                disabled={modal === "edit"}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Discord
              </label>
              <Input
                className={cls}
                value={form.discord}
                onChange={set("discord")}
                placeholder="jade#0000"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                TikTok
              </label>
              <Input
                className={cls}
                value={form.tiktok}
                onChange={set("tiktok")}
                placeholder="@jade_w"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Stream URL
              </label>
              <Input
                className={cls}
                value={form.stream_url}
                onChange={set("stream_url")}
                placeholder="https://twitch.tv/..."
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:flex-row pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={closeModal}
              className="flex-1 text-[12px] border-(--border-mid) text-(--text-secondary) cursor-pointer"
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
            Supprimer @{selected?.pseudo} ? Ses personnages seront orphelins.
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
