"use client";

import { PageHeader } from "@/app/_composents/admin/ui";
import { ExternalLink, Film, Sparkles, Trash2, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { deleteCreatorPostAdmin } from "./actions";

type CreatorPostRequest = {
  id: string;
  type: "ARTISTE" | "EDITEUR";
  imageUrl: string | null;
  linkUrl: string | null;
  platform: string | null;
  caption: string | null;
  createdAt: string;
  characters: { id: string; nom: string }[];
  user: {
    pseudo: string | null;
    avatarUrl: string | null;
    clerkUsername: string;
  };
};

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter / X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITCH: "Twitch",
  AUTRE: "Autre",
};

export default function AdminCreatorsPage() {
  const [posts, setPosts] = useState<CreatorPostRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/admin/creator-posts")
      .then((r) => r.json())
      .then((posts) => {
        setPosts(posts);
        setLoading(false);
      });
  }, []);

  async function handleDeletePost(id: string) {
    setPending((p) => ({ ...p, [id]: true }));
    try {
      await deleteCreatorPostAdmin(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setPending((p) => ({ ...p, [id]: false }));
    }
  }

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <PageHeader
        title="Créateurs"
        meta="Publications des créateurs (fan arts, edits). Les signalements sont dans Modération."
      />

      <div className="flex-1 p-6 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-border bg-card animate-pulse"
            />
          ))
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <p className="text-sm">Aucune publication pour l&apos;instant</p>
          </div>
        ) : (
          posts.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
            >
              {/* Aperçu */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted overflow-hidden">
                {p.imageUrl ? (
                  <img
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_56,h_56,c_fill/${p.imageUrl}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Film className="h-4 w-4 text-blue-400" />
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted overflow-hidden">
                    {p.user.avatarUrl ? (
                      <Image
                        src={p.user.avatarUrl}
                        width={20}
                        height={20}
                        alt=""
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-[13px] font-medium text-text-primary">
                    {p.user.pseudo ?? p.user.clerkUsername}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                      p.type === "ARTISTE"
                        ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                        : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {p.type === "ARTISTE" ? (
                      <Sparkles className="h-2.5 w-2.5" />
                    ) : (
                      <Film className="h-2.5 w-2.5" />
                    )}
                    {p.type === "ARTISTE" ? "Fan art" : "Edit-maker"}
                  </span>
                  {p.characters.map((c) => (
                    <span
                      key={c.id}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-border text-text-muted"
                    >
                      {c.nom}
                    </span>
                  ))}
                </div>

                {p.caption && (
                  <p className="text-[12px] text-text-secondary mt-1.5">
                    {p.caption}
                  </p>
                )}

                {p.linkUrl && (
                  <a
                    href={p.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-accent-light border border-border bg-elevated rounded-md px-2 py-0.5 transition-colors"
                  >
                    {p.platform ? PLATFORM_LABELS[p.platform] : "Lien"}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}

                <p className="text-[10px] text-text-muted mt-1.5">
                  Publié le{" "}
                  {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleDeletePost(p.id)}
                  disabled={pending[p.id]}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
