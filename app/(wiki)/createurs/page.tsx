// app/createurs/page.tsx
"use client";

import { PublishCreatorPostButton } from "@/components/user/PublishCreatorPostButton";
import {
  ChevronDown,
  ExternalLink,
  Film,
  Sparkles,
  User,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type CreatorPost = {
  id: string;
  type: "ARTISTE" | "EDITEUR";
  imageUrl: string | null;
  linkUrl: string | null;
  platform: string | null;
  caption: string | null;
  createdAt: string;
  creator: { pseudo: string; avatarUrl: string | null };
};

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter / X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITCH: "Twitch",
  AUTRE: "Autre",
};

const TABS = [
  { key: "all", label: "Tous" },
  { key: "ARTISTE", label: "Fan art", icon: <Sparkles className="h-3 w-3" /> },
  { key: "EDITEUR", label: "Edits", icon: <Film className="h-3 w-3" /> },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function CreateursPage() {
  const [data, setData] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [rulesOpen, setRulesOpen] = useState(false);

  const load = useCallback(() => {
    fetch("/api/creator-posts")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = tab === "all" ? data : data.filter((p) => p.type === tab);

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-5 lg:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-text-primary">
              Créateurs de contenu
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Fan art, edits et créations de la communauté Flashback WL
            </p>
          </div>
          <PublishCreatorPostButton
            onPublished={load}
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-accent/90 transition-colors shrink-0"
          />
          <button
            onClick={() => setRulesOpen((o) => !o)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted hover:text-text-secondary transition-colors shrink-0"
          >
            Règles
            <ChevronDown
              className={`h-3 w-3 transition-transform ${rulesOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {rulesOpen && (
          <div className="mt-4 border-t border-border pt-4 space-y-1.5">
            <p className="text-[11px] text-text-muted leading-relaxed mb-2">
              Je me permets de mettre quelques règles en place pour que cet
              endroit reste une place de bienveillance et de partage :
            </p>
            {[
              "Le contenu partagé doit être en lien avec Flashback WL",
              "Pas de contenu offensant ou haineux",
              "Le pseudo doit correspondre à ton pseudo habituel dans la communauté",
              "Les liens partagés doivent pointer vers ton propre contenu",
              "Les comptes de clipfarming ne seront pas acceptés",
              "Chaque publication est examinée manuellement avant d'apparaître sur la page",
              "Aucun délai de validation garanti - sois patient",
            ].map((rule, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-text-muted"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/50" />
                {rule}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {TABS.map((t) => {
          const count =
            t.key === "all"
              ? data.length
              : data.filter((p) => p.type === t.key).length;
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
              {"icon" in t && t.icon}
              {t.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-accent/20" : "bg-elevated"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grille */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-muted-foreground">
          <p className="text-sm">
            Aucune publication dans cette catégorie pour l&apos;instant.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: CreatorPost }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-accent/30">
      {post.type === "ARTISTE" && post.imageUrl ? (
        <a
          href={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${post.imageUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-square w-full overflow-hidden bg-muted"
        >
          <img
            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,c_fill/${post.imageUrl}`}
            alt={post.caption ?? "Fan art"}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </a>
      ) : (
        <a
          href={post.linkUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-elevated text-center px-3"
        >
          <Film className="h-6 w-6 text-blue-400" />
          <span className="flex items-center gap-1 text-[11px] font-medium text-text-secondary">
            {post.platform ? PLATFORM_LABELS[post.platform] : "Voir l'edit"}
            <ExternalLink className="h-2.5 w-2.5" />
          </span>
        </a>
      )}

      <div className="flex flex-col gap-1.5 p-2.5">
        {post.caption && (
          <p className="line-clamp-2 text-[11px] text-text-secondary">
            {post.caption}
          </p>
        )}
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
            {post.creator.avatarUrl ? (
              <Image
                src={post.creator.avatarUrl}
                width={16}
                height={16}
                alt={post.creator.pseudo}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <User className="h-2.5 w-2.5 text-muted-foreground" />
            )}
          </div>
          <span className="truncate text-[10px] text-text-muted">
            {post.creator.pseudo}
          </span>
        </div>
      </div>
    </div>
  );
}
