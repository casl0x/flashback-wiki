// app/admin/creators/page.tsx
"use client";

import { Check, ExternalLink, User, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { updateCreatorRoleStatus } from "./actions";

type SocialLink = { platform: string; url: string };

type CreatorRequest = {
  id: string;
  type: "ARTISTE" | "EDITEUR";
  status: "pending" | "approved" | "rejected";
  displayOnWiki: boolean;
  createdAt: string;
  user: {
    pseudo: string | null;
    avatarUrl: string | null;
    clerkUsername: string;
  };
  socialLinks: SocialLink[];
};

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter / X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITCH: "Twitch",
  AUTRE: "Autre",
};

const STATUS_TABS = [
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Approuvés" },
  { key: "rejected", label: "Refusés" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["key"];

export default function AdminCreatorsPage() {
  const [data, setData] = useState<CreatorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusTab>("pending");
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/admin/creators")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  async function handleAction(id: string, status: "approved" | "rejected") {
    setPending((p) => ({ ...p, [id]: true }));
    try {
      await updateCreatorRoleStatus(id, status);
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } finally {
      setPending((p) => ({ ...p, [id]: false }));
    }
  }

  const filtered = data.filter((r) => r.status === tab);
  const pendingCount = data.filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-text-primary">
            Créateurs de contenu
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Validation des profils artistes et edit-makers
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
            {pendingCount} en attente
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4">
        {STATUS_TABS.map((t) => {
          const count = data.filter((r) => r.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                tab === t.key
                  ? "bg-accent/10 text-accent-light"
                  : "text-text-muted hover:text-text-secondary hover:bg-elevated"
              }`}
            >
              {t.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? "bg-accent/20" : "bg-elevated"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div className="flex-1 p-6 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-border bg-card animate-pulse"
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <p className="text-sm">
              Aucune demande{" "}
              {STATUS_TABS.find((t) => t.key === tab)?.label.toLowerCase()}
            </p>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted overflow-hidden">
                {r.user.avatarUrl ? (
                  <Image
                    src={r.user.avatarUrl}
                    width={36}
                    height={36}
                    alt={r.user.pseudo ?? ""}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-medium text-text-primary">
                    {r.user.pseudo ?? r.user.clerkUsername}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      r.type === "ARTISTE"
                        ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                        : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {r.type === "ARTISTE" ? "Artiste" : "Edit-maker"}
                  </span>
                  {r.displayOnWiki && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-text-muted">
                      Souhaite être affiché
                    </span>
                  )}
                </div>

                {/* Liens */}
                {r.socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.socialLinks.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-text-muted hover:text-accent-light border border-border bg-elevated rounded-md px-2 py-0.5 transition-colors"
                      >
                        {PLATFORM_LABELS[l.platform] ?? l.platform}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-text-muted mt-1.5">
                  Demande le{" "}
                  {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Actions pending */}
              {tab === "pending" && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAction(r.id, "rejected")}
                    disabled={pending[r.id]}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleAction(r.id, "approved")}
                    disabled={pending[r.id]}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted hover:text-green-400 hover:border-green-500/30 transition-colors disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Badge statut approuvé/refusé */}
              {tab !== "pending" && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      r.status === "approved"
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : "border-red-500/30 bg-red-500/10 text-red-400"
                    }`}
                  >
                    {r.status === "approved" ? "Approuvé" : "Refusé"}
                  </span>
                  {/* Permettre de changer le statut depuis les autres tabs aussi */}
                  <button
                    onClick={() =>
                      handleAction(
                        r.id,
                        r.status === "approved" ? "rejected" : "approved",
                      )
                    }
                    disabled={pending[r.id]}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-muted hover:bg-elevated transition-colors disabled:opacity-50"
                  >
                    {r.status === "approved" ? (
                      <X className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
