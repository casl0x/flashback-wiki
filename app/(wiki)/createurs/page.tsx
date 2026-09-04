// app/createurs/page.tsx
"use client";

import { deleteCreatorPost } from "@/app/profil/actions";
import { PublishCreatorPostButton } from "@/components/user/PublishCreatorPostButton";
import { useUser } from "@clerk/nextjs";
import {
  ChevronDown,
  ExternalLink,
  Film,
  Sparkles,
  Trash2,
  User,
  UserCircle2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CreatorPost = {
  id: string;
  type: "ARTISTE" | "EDITEUR";
  imageUrl: string | null;
  linkUrl: string | null;
  platform: string | null;
  caption: string | null;
  createdAt: string;
  characters: { id: string; nom: string }[];
  creator: { pseudo: string; avatarUrl: string | null; clerkUserId: string };
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
  const { isLoaded, isSignedIn, user } = useUser();
  const [data, setData] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [approvedTypes, setApprovedTypes] = useState<("ARTISTE" | "EDITEUR")[]>(
    [],
  );
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(
    null,
  );

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

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

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        const roles = (d?.creatorRoles ?? []) as {
          type: "ARTISTE" | "EDITEUR";
          status?: string;
        }[];
        setApprovedTypes(
          roles.filter((r) => r.status === "approved").map((r) => r.type),
        );
      });
  }, [isLoaded, isSignedIn]);

  const filtered = tab === "all" ? data : data.filter((p) => p.type === tab);

  async function handleDelete(id: string) {
    setData((prev) => prev.filter((p) => p.id !== id));
    await deleteCreatorPost(id);
  }

  return (
    <>
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
            {approvedTypes.length > 0 && (
              <PublishCreatorPostButton
                defaultType={approvedTypes[0]}
                allowedTypes={approvedTypes}
                onPublished={load}
                className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-accent/90 transition-colors shrink-0"
              />
            )}
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
                "Ton profil créateur est examiné manuellement avant de pouvoir publier",
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
              <PostCard
                key={post.id}
                post={post}
                isOwn={!!user && post.creator.clerkUserId === user.id}
                onDelete={handleDelete}
                onOpenImage={setLightbox}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt={lightbox.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}

function PostCard({
  post,
  isOwn,
  onDelete,
  onOpenImage,
}: {
  post: CreatorPost;
  isOwn: boolean;
  onDelete: (id: string) => void;
  onOpenImage: (image: { url: string; alt: string }) => void;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-accent/30">
      {isOwn && (
        <button
          onClick={() => onDelete(post.id)}
          className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
      {post.type === "ARTISTE" && post.imageUrl ? (
        <button
          type="button"
          onClick={() =>
            onOpenImage({
              url: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${post.imageUrl}`,
              alt: post.caption ?? "Fan art",
            })
          }
          className="relative block aspect-square w-full overflow-hidden bg-muted cursor-zoom-in"
        >
          <img
            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,c_fill/${post.imageUrl}`}
            alt={post.caption ?? "Fan art"}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </button>
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
        {post.characters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.characters.map((c) => (
              <Link
                key={c.id}
                href={`/personnages/${c.id}`}
                className="inline-flex w-fit items-center gap-1 text-[10px] text-accent-light hover:underline"
              >
                <UserCircle2 className="h-2.5 w-2.5" />
                {c.nom}
              </Link>
            ))}
          </div>
        )}
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
