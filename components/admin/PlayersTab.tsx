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

import Image from "next/image";
import { useEffect, useState } from "react";
import { getAvatarStyle, getInitials } from "../wiki/CharacterCard";
import { BadgeKey, BADGES_CONFIG, PlayerBadges } from "./PlayerBadges";

// ─── Types ────────────────────────────────────────────────────────────────────

type Player = {
  id: string;
  pseudo: string;
  stream: boolean;
  lienChaine: string | null;
  reseaux: Record<string, string>;
  badges: string[];
  createdAt: string;
  imageUrl?: string | null;
};

export const RESEAUX_OPTIONS = [
  {
    key: "tiktok",
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
      </svg>
    ),
    color: "#ee1d52",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.52V8.48L15.82 12l-6.07 3.52z" />
      </svg>
    ),
    color: "#ff0000",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
    color: "#e1306c",
  },
  {
    key: "twitter",
    label: "Twitter/X",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: "#1da1f2",
  },
] as const;

type ReseauKey = (typeof RESEAUX_OPTIONS)[number]["key"];

type PlayerForm = {
  pseudo: string;
  stream: boolean;
  lienChaine: string;
  reseaux: Partial<Record<ReseauKey, string>>;
  badges: BadgeKey[];
};

const inputCls =
  "h-8 text-[12px] bg-[var(--elevated)] border-[var(--border-mid)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-0 placeholder:text-[var(--text-muted)]";

// ─── Composant principal ──────────────────────────────────────────────────────

export function PlayersTab() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Player | null>(null);
  const [form, setForm] = useState<PlayerForm>({
    pseudo: "",
    stream: false,
    lienChaine: "",
    reseaux: {},
    badges: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const filtered = players.filter((p) =>
    p.pseudo.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/data", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setPlayers(data.players ?? []);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openAdd() {
    setForm({
      pseudo: "",
      stream: false,
      lienChaine: "",
      reseaux: {},
      badges: [],
    });
    setModal("add");
  }

  function openEdit(p: Player) {
    setSelected(p);
    setForm({
      pseudo: p.pseudo,
      stream: p.stream ?? false,
      lienChaine: p.lienChaine ?? "",
      reseaux: (p.reseaux ?? {}) as Partial<Record<ReseauKey, string>>,
      badges: (p.badges ?? []) as BadgeKey[],
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

  function setReseau(key: ReseauKey, value: string) {
    setForm((f) => ({
      ...f,
      reseaux: value
        ? { ...f.reseaux, [key]: value }
        : (Object.fromEntries(
            Object.entries(f.reseaux).filter(([k]) => k !== key),
          ) as Partial<Record<ReseauKey, string>>),
    }));
  }

  function toggleBadge(key: BadgeKey) {
    setForm((f) => {
      const newBadges = f.badges.includes(key)
        ? f.badges.filter((b) => b !== key)
        : [...f.badges, key];

      return {
        ...f,
        badges: newBadges,
        stream: newBadges.includes("streamer"),
      };
    });
  }

  async function submit() {
    setLoading(true);
    const body = {
      pseudo: form.pseudo,
      stream: form.stream,
      lienChaine: form.lienChaine || null,
      reseaux: form.reseaux,
      badges: form.badges,
    };
    if (modal === "add") {
      await fetch("/api/players", {
        method: "POST",
        body: JSON.stringify(body),
      });
    } else if (modal === "edit" && selected) {
      await fetch("/api/players", {
        method: "PATCH",
        body: JSON.stringify({
          id: selected.id,
          originalPseudo: selected.pseudo,
          ...body,
        }),
      });
    }
    await new Promise((r) => setTimeout(r, 300));
    const res = await fetch("/api/data", { cache: "no-store" });
    const data = await res.json();
    setPlayers(data.players ?? []);
    setLoading(false);
    closeModal();
  }

  async function confirmDelete() {
    if (!selected) return;
    await fetch("/api/players", {
      method: "DELETE",
      body: JSON.stringify({ id: selected.id }),
    });
    await new Promise((r) => setTimeout(r, 300));
    const res = await fetch("/api/data", { cache: "no-store" });
    const data = await res.json();
    setPlayers(data.players ?? []);
    closeModal();
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold tracking-wide text-text-primary">
            Joueurs
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
          <Button
            size="sm"
            onClick={openAdd}
            className="h-7 text-[11px] bg-accent hover:bg-accent-hover text-white border-0 cursor-pointer"
          >
            + Ajouter
          </Button>
        </div>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-2">
        {filtered.map((p) => {
          const avatarStyle = getAvatarStyle(p.pseudo);
          const reseauxEntries = Object.entries(p.reseaux ?? {}) as [
            ReseauKey,
            string,
          ][];
          return (
            <Card
              key={p.id}
              className="bg-card border-border hover:border-border-mid transition-colors"
            >
              <CardContent className="px-4 py-3 flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full border-2 shrink-0 overflow-hidden flex items-center justify-center text-[13px] font-medium"
                  style={avatarStyle}
                >
                  {p.imageUrl ? (
                    <Image
                      src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_44,h_44,c_fill,g_face/${p.imageUrl}`}
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                      alt={p.pseudo}
                      unoptimized
                    />
                  ) : (
                    getInitials(p.pseudo)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-text-primary">
                      {p.pseudo}
                    </span>
                    <PlayerBadges badges={p.badges ?? []} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    {p.lienChaine && (
                      <a
                        href={p.lienChaine}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-text-muted hover:text-accent-light underline underline-offset-2 transition-colors truncate max-w-35"
                      >
                        {p.lienChaine.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {reseauxEntries.length > 0 && (
                      <div className="flex items-center gap-1">
                        {reseauxEntries.map(([key, url]) => {
                          const opt = RESEAUX_OPTIONS.find(
                            (r) => r.key === key,
                          );
                          if (!opt) return null;
                          return (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={opt.label}
                              style={{ color: opt.color }}
                              className="opacity-70 hover:opacity-100 transition-opacity"
                            >
                              {opt.icon}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-[11px] text-text-muted hover:text-accent-light px-2 py-1 rounded hover:bg-elevated transition-colors cursor-pointer"
                  >
                    Éditer
                  </button>
                  <button
                    onClick={() => openDelete(p)}
                    className="text-[11px] text-text-muted hover:text-[#f87171] px-2 py-1 rounded hover:bg-[#2e1010] transition-colors cursor-pointer"
                  >
                    Suppr.
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal add/edit */}
      <Dialog
        open={modal === "add" || modal === "edit"}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent className="bg-card border-border-mid max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px] tracking-wide text-text-primary">
              {modal === "edit" ? "Modifier le joueur" : "Nouveau joueur"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* Pseudo */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-text-muted">
                Pseudo
              </label>
              <Input
                className={inputCls}
                value={form.pseudo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pseudo: e.target.value }))
                }
                placeholder="Jade_W"
              />
            </div>

            {/* Lien chaîne */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-text-muted">
                Lien chaîne (stream)
              </label>
              <Input
                className={inputCls}
                value={form.lienChaine}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lienChaine: e.target.value }))
                }
                placeholder="https://twitch.tv/..."
              />
            </div>

            {/* Réseaux sociaux */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-text-muted">
                Réseaux sociaux
              </label>
              {RESEAUX_OPTIONS.map((r) => (
                <div key={r.key} className="flex items-center gap-2">
                  <span
                    className="flex items-center gap-1.5 text-[11px] w-24 shrink-0"
                    style={{ color: r.color }}
                  >
                    {r.icon}
                    {r.label}
                  </span>
                  <Input
                    className={`${inputCls} flex-1`}
                    value={form.reseaux[r.key] ?? ""}
                    onChange={(e) => setReseau(r.key, e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>

            {/* Badges */}
            {/* Badges */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-text-muted">
                Badges
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BADGES_CONFIG.map((cfg) => {
                  const active = form.badges.includes(cfg.key);
                  const Icon = cfg.icon; // ← récupère l'icône
                  return (
                    <button
                      key={cfg.key}
                      type="button"
                      onClick={() => toggleBadge(cfg.key as BadgeKey)}
                      style={
                        active
                          ? {
                              borderColor: cfg.color,
                              backgroundColor: cfg.bg,
                              color: cfg.color,
                            }
                          : {}
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                        active
                          ? ""
                          : "border-(--border) bg-(--elevated) text-(--text-muted) hover:border-(--border-mid)"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {/* ← icône Lucide */}
                      <span>{cfg.label}</span>
                      {active && (
                        <span className="ml-auto text-[10px] opacity-60">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
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
              disabled={loading || !form.pseudo}
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
            <DialogTitle className="text-[14px] tracking-wide text-text-primary">
              Confirmation
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-text-secondary">
            Supprimer @{selected?.pseudo} ? Ses personnages seront orphelins.
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
