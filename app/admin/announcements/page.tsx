// app/admin/announcements/page.tsx
"use client";

import { Megaphone, Plus, Trash2, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementActive,
} from "./actions";

type Announcement = {
  id: string;
  message: string;
  active: boolean;
  createdAt: string;
};

type UserResult = {
  clerkUserId: string;
  username: string;
  avatarUrl: string | null;
};

type Target = "all" | "user";

export default function AdminAnnouncementsPage() {
  const [data, setData] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const [target, setTarget] = useState<Target>("all");
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [sentFeedback, setSentFeedback] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/announcements")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!userQuery.trim() || selectedUser) return;
    const t = setTimeout(() => {
      fetch(`/api/admin/users?q=${encodeURIComponent(userQuery.trim())}`)
        .then((r) => r.json())
        .then((d) => setUserResults(Array.isArray(d) ? d : []));
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery, selectedUser]);

  const visibleResults = !selectedUser && userQuery.trim() ? userResults : [];

  async function handleCreate() {
    if (!message.trim()) return;
    if (target === "user" && !selectedUser) return;

    setSending(true);
    try {
      await createAnnouncement(message, selectedUser?.clerkUserId);
      setSentFeedback(
        target === "user"
          ? `Message envoyé à ${selectedUser?.username}.`
          : "Annonce publiée pour tout le monde.",
      );
      setMessage("");
      setSelectedUser(null);
      setUserQuery("");
      if (target === "all") load();
      setTimeout(() => setSentFeedback(null), 4000);
    } finally {
      setSending(false);
    }
  }

  async function handleToggle(id: string, active: boolean) {
    setPending((p) => ({ ...p, [id]: true }));
    try {
      await toggleAnnouncementActive(id, active);
      load();
    } finally {
      setPending((p) => ({ ...p, [id]: false }));
    }
  }

  async function handleDelete(id: string) {
    setPending((p) => ({ ...p, [id]: true }));
    try {
      await deleteAnnouncement(id);
      load();
    } finally {
      setPending((p) => ({ ...p, [id]: false }));
    }
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <h1 className="text-[15px] font-semibold text-text-primary flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-accent" />
          Annonces
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Envoie une notification pop-up publique, ou un message privé à un seul
          utilisateur.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Formulaire */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {/* Destinataire */}
          <div className="flex gap-1.5">
            {[
              { key: "all" as const, label: "Tout le monde" },
              { key: "user" as const, label: "Un utilisateur" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTarget(key)}
                className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  target === key
                    ? "border-accent/40 bg-accent/10 text-accent-light"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {target === "user" && (
            <div className="flex flex-col gap-1.5">
              {selectedUser ? (
                <span className="flex w-fit items-center gap-1.5 rounded-md border border-border bg-elevated px-2.5 py-1 text-[12px] text-text-secondary">
                  <User className="h-3 w-3" />
                  {selectedUser.username}
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : (
                <div className="relative">
                  <input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Rechercher un pseudo..."
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                  />
                  {visibleResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                      {visibleResults.map((u) => (
                        <button
                          key={u.clerkUserId}
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setUserResults([]);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-text-secondary hover:bg-elevated"
                        >
                          <User className="h-3 w-3 text-muted-foreground" />
                          {u.username}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              target === "all"
                ? "Ton annonce (maintenance prévue, nouvelle fonctionnalité...)"
                : "Ton message privé pour cet utilisateur..."
            }
            className="h-20 w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
          />
          <button
            onClick={handleCreate}
            disabled={
              sending || !message.trim() || (target === "user" && !selectedUser)
            }
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {sending
              ? "…"
              : target === "all"
                ? "Publier l'annonce"
                : "Envoyer le message"}
          </button>

          {sentFeedback && (
            <p className="text-[11px] text-green-400">{sentFeedback}</p>
          )}
        </div>

        {/* Liste des annonces publiques */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Annonces publiques
          </p>
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl border border-border bg-card animate-pulse"
              />
            ))
          ) : data.length === 0 ? (
            <p className="text-sm text-text-muted">
              Aucune annonce pour l&apos;instant.
            </p>
          ) : (
            data.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-secondary">{a.message}</p>
                  <p className="text-[10px] text-text-muted mt-1.5">
                    {new Date(a.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {!a.active && (
                      <span className="ml-2 rounded-full border border-border px-1.5 py-0.5 text-[9px]">
                        Désactivée
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggle(a.id, !a.active)}
                    disabled={pending[a.id]}
                    className="rounded-md border border-border px-2 py-1 text-[11px] text-text-muted hover:text-text-primary hover:bg-elevated transition-colors disabled:opacity-50"
                  >
                    {a.active ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={pending[a.id]}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-muted hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
