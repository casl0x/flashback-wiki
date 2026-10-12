// app/admin/announcements/page.tsx
"use client";

import { Megaphone, Plus, Trash2 } from "lucide-react";
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

export default function AdminAnnouncementsPage() {
  const [data, setData] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<Record<string, boolean>>({});

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

  async function handleCreate() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await createAnnouncement(message);
      setMessage("");
      load();
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
          Envoie une notification pop-up à tous les utilisateurs connectés, à
          leur prochain chargement de page.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Formulaire */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ton annonce (maintenance prévue, nouvelle fonctionnalité...)"
            className="h-20 w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
          />
          <button
            onClick={handleCreate}
            disabled={sending || !message.trim()}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {sending ? "…" : "Publier l'annonce"}
          </button>
        </div>

        {/* Liste */}
        <div className="space-y-2">
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
