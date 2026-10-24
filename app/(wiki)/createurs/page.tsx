"use client";

import { useSearch } from "@/app/_composents/SearchContext";
import { PublishCreatorPostButton } from "@/app/_composents/user/PublishCreatorPostButton";
import { deleteCreatorPost } from "@/app/profil/actions";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { anton } from "@/lib/fonts";
import { youtubeThumbnail } from "@/lib/media-embed";
import { cn, matchesSearch } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import {
  ChevronDown,
  ExternalLink,
  Film,
  Play,
  Trash2,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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

type Creator = {
  id: string;
  pseudo: string;
  avatarUrl: string | null;
  types: ("ARTISTE" | "EDITEUR")[];
  roles: {
    type: "ARTISTE" | "EDITEUR";
    bio: string | null;
    socialLinks: { platform: string; url: string }[];
  }[];
};

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter / X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITCH: "Twitch",
  AUTRE: "Autre",
};

const TYPE_STYLE = {
  ARTISTE: { label: "Fan art", color: "#E5A3F0" },
  EDITEUR: { label: "Edit", color: "#8AB4FF" },
} as const;

const TABS = [
  { key: "all" as const, label: "Tous" },
  { key: "ARTISTE" as const, label: "Fan arts" },
  { key: "EDITEUR" as const, label: "Edits" },
];

type Tab = (typeof TABS)[number]["key"];

export default function CreateursPage() {
  const ctx = useSearch();
  const query = ctx?.query ?? "";
  const { isLoaded, isSignedIn, user } = useUser();
  const [data, setData] = useState<CreatorPost[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [approvedTypes, setApprovedTypes] = useState<("ARTISTE" | "EDITEUR")[]>(
    [],
  );
  const [viewer, setViewer] = useState<CreatorPost | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const closeViewer = useCallback(() => {
    setViewer(null);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!viewer) return;
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeViewer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, closeViewer]);

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
    fetch("/api/creators")
      .then((r) => r.json())
      .then(setCreators);
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

  const filtered = data.filter((p) => {
    const matchTab = tab === "all" || p.type === tab;
    const matchSearch =
      matchesSearch(p.creator.pseudo, query) ||
      matchesSearch(p.caption, query) ||
      p.characters.some((c) => matchesSearch(c.nom, query));

    return matchTab && matchSearch;
  });

  async function handleDelete(id: string) {
    setData((prev) => prev.filter((p) => p.id !== id));
    await deleteCreatorPost(id);
  }

  function openViewer(post: CreatorPost, trigger: HTMLElement) {
    triggerRef.current = trigger;
    setViewer(post);
  }

  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      <header className="mx-auto max-w-295 px-4 pt-10 pb-4 sm:px-5 sm:pt-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className={cn(
                anton.className,
                "m-0 text-[clamp(48px,9vw,80px)] uppercase leading-[0.95]",
              )}
            >
              Créations
            </h1>
            <p className="mt-3 max-w-2xl text-[16px] text-[#A3A8B3]">
              Fan arts, edits et créations de la communauté autour des
              personnages de Flashback.
            </p>
          </div>
          <div className="flex flex-none items-center gap-4">
            <button
              onClick={() => setRulesOpen((o) => !o)}
              aria-expanded={rulesOpen}
              className="flex min-h-11 items-center gap-1 text-[13px] font-semibold text-[#8AB4FF] hover:underline"
            >
              Lire les règles
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  rulesOpen && "rotate-180",
                )}
              />
            </button>
            <ShareCreationButton
              approvedTypes={approvedTypes}
              isSignedIn={!!isSignedIn}
              onPublished={load}
            />
          </div>
        </div>

        {rulesOpen && (
          <div className="mt-5 flex flex-col gap-1.5 rounded-[10px] border border-[#23262D] bg-[#15171B] p-4">
            <p className="mb-1 text-[13px] leading-relaxed text-[#9AA0AA]">
              Quelques règles pour que cet endroit reste une place de
              bienveillance et de partage :
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
                className="flex items-start gap-2 text-[13px] text-[#C4C7CF]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F6FEB]" />
                {rule}
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto flex max-w-295 flex-col gap-6 px-4 pb-16 sm:px-5">
        <div
          role="tablist"
          aria-label="Filtrer les créations"
          className="flex flex-wrap gap-2"
        >
          {TABS.map((t) => {
            const count =
              t.key === "all"
                ? data.length
                : data.filter((p) => p.type === t.key).length;
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3.5 text-[14px] font-semibold transition-colors",
                  on
                    ? "border-[#ECECEE] bg-[#ECECEE] text-[#0E0F12]"
                    : "border-[#3A3E47] text-[#C4C7CF] hover:border-[#6E7380]",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    on ? "bg-[#0E0F12]/10" : "bg-[#23262D]",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="columns-2 gap-3 sm:columns-2 lg:columns-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="mb-3 aspect-square animate-pulse rounded-xl border border-[#23262D] bg-[#15171B]"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#3A3E47] py-16 text-center text-[#9AA0AA]">
            <p className="text-[14px]">
              {query
                ? `Aucune création ne correspond à "${query}".`
                : "Aucune création dans cette catégorie pour l'instant."}
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-3 sm:columns-2 lg:columns-3">
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isOwn={!!user && post.creator.clerkUserId === user.id}
                onDelete={handleDelete}
                onOpen={openViewer}
              />
            ))}
          </div>
        )}

        {creators.length > 0 && (
          <section
            aria-labelledby="createurs-h"
            className="flex flex-col gap-4 pt-4"
          >
            <h2
              id="createurs-h"
              className={cn(
                anton.className,
                "m-0 text-[26px] uppercase tracking-[0.02em] sm:text-[30px]",
              )}
            >
              Créateurs
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((c) => (
                <CreatorCard key={c.id} creator={c} />
              ))}
            </div>
          </section>
        )}
      </main>

      {viewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeViewer}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={viewer.caption ?? "Création"}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-full max-w-2xl flex-col gap-3 outline-none"
          >
            <button
              onClick={closeViewer}
              aria-label="Fermer la visionneuse"
              className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>

            {viewer.type === "ARTISTE" && viewer.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cloudinaryUrl(viewer.imageUrl, "w_1200")}
                alt={viewer.caption ?? `Création de ${viewer.creator.pseudo}`}
                className="max-h-[75vh] w-auto rounded-lg object-contain"
              />
            ) : (
              <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-[#15171B]">
                {youtubeThumbnail(viewer.linkUrl) ? (
                  <Image
                    src={youtubeThumbnail(viewer.linkUrl)!}
                    alt=""
                    fill
                    unoptimized
                    sizes="800px"
                    className="object-cover"
                  />
                ) : null}
                <a
                  href={viewer.linkUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-[#0E0F12] hover:bg-white"
                  aria-label={`Ouvrir sur ${viewer.platform ? PLATFORM_LABELS[viewer.platform] : "le site"}`}
                >
                  <Play className="ml-1 h-6 w-6 fill-current" />
                </a>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#15171B] px-4 py-3">
              <div className="flex min-w-0 flex-col gap-1">
                {viewer.caption && (
                  <p className="text-[14px] text-[#ECECEE]">{viewer.caption}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#9AA0AA]">
                  <span>{viewer.creator.pseudo}</span>
                  {viewer.characters.length > 0 && (
                    <span>
                      avec{" "}
                      {viewer.characters.map((c, i) => (
                        <span key={c.id}>
                          {i > 0 && ", "}
                          <Link
                            href={`/personnages/${c.id}`}
                            className="text-[#8AB4FF] hover:underline"
                          >
                            {c.nom}
                          </Link>
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              {viewer.linkUrl && (
                <a
                  href={viewer.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 flex-none items-center gap-1 text-[13px] font-semibold text-[#8AB4FF] hover:underline"
                >
                  Ouvrir ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShareCreationButton({
  approvedTypes,
  isSignedIn,
  onPublished,
}: {
  approvedTypes: ("ARTISTE" | "EDITEUR")[];
  isSignedIn: boolean;
  onPublished: () => void;
}) {
  const btnClass =
    "inline-flex min-h-11 items-center gap-1.5 rounded-md bg-[#2F6FEB] px-4 text-[14px] font-bold text-white hover:bg-[#2F6FEB]/90 transition-colors";

  if (approvedTypes.length > 0) {
    return (
      <PublishCreatorPostButton
        defaultType={approvedTypes[0]}
        allowedTypes={approvedTypes}
        onPublished={onPublished}
        className={btnClass}
      />
    );
  }

  if (isSignedIn) {
    return (
      <Link href="/profil#createur" className={btnClass}>
        + Partager une création
      </Link>
    );
  }

  return (
    <Link href="/sign-in?redirect_url=/createurs" className={btnClass}>
      + Partager une création
    </Link>
  );
}

function PostCard({
  post,
  isOwn,
  onDelete,
  onOpen,
}: {
  post: CreatorPost;
  isOwn: boolean;
  onDelete: (id: string) => void;
  onOpen: (post: CreatorPost, trigger: HTMLElement) => void;
}) {
  const style = TYPE_STYLE[post.type];
  const thumb = post.type === "EDITEUR" ? youtubeThumbnail(post.linkUrl) : null;
  const alt = post.caption ?? `Création de ${post.creator.pseudo}`;

  return (
    <div className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl border border-[#23262D] bg-[#15171B] transition-colors hover:border-[#3A3E47]">
      {isOwn && (
        <button
          onClick={() => onDelete(post.id)}
          aria-label="Supprimer cette création"
          className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={(e) => onOpen(post, e.currentTarget)}
        aria-label={`Agrandir : ${alt}`}
        className="relative block w-full cursor-zoom-in"
      >
        <span
          className="absolute left-2 top-2 z-10 rounded px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#0E0F12]"
          style={{ background: style.color }}
        >
          {style.label}
        </span>

        {post.type === "ARTISTE" && post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cloudinaryUrl(post.imageUrl, "w_500,c_fill")}
            alt={alt}
            className="w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <span className="relative block aspect-video w-full bg-[#22252B]">
            {thumb ? (
              <Image
                src={thumb}
                alt={alt}
                fill
                unoptimized
                sizes="400px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <Film className="h-6 w-6 text-[#8AB4FF]" />
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-[#0E0F12]">
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </span>
            </span>
          </span>
        )}
      </button>

      <div className="flex flex-col gap-1.5 p-3">
        {post.characters.length > 0 && (
          <div className="flex flex-wrap items-baseline gap-1 text-[12px] text-[#9AA0AA]">
            avec
            {post.characters.map((c) => (
              <Link
                key={c.id}
                href={`/personnages/${c.id}`}
                className="text-[#8AB4FF] hover:underline"
              >
                {c.nom}
              </Link>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#23262D] bg-[#22252B]">
            {post.creator.avatarUrl ? (
              <Image
                src={post.creator.avatarUrl}
                width={20}
                height={20}
                alt=""
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-3 w-3 text-[#9AA0AA]" />
            )}
          </span>
          <span className="truncate text-[12px] font-semibold text-[#C4C7CF]">
            {post.creator.pseudo}
          </span>
        </div>
      </div>
    </div>
  );
}

function CreatorCard({ creator }: { creator: Creator }) {
  const links = creator.roles.flatMap((r) => r.socialLinks);
  const bio = creator.roles.find((r) => r.bio)?.bio;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#23262D] bg-[#15171B] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#23262D] bg-[#22252B]">
          {creator.avatarUrl ? (
            <Image
              src={creator.avatarUrl}
              width={44}
              height={44}
              alt=""
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-[#9AA0AA]" />
          )}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-bold text-[#ECECEE]">
            {creator.pseudo}
          </span>
          <span className="flex flex-wrap gap-1.5">
            {creator.types.map((t) => (
              <span
                key={t}
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: TYPE_STYLE[t].color }}
              >
                {TYPE_STYLE[t].label}
              </span>
            ))}
          </span>
        </div>
      </div>

      {bio && (
        <p className="text-[13px] leading-relaxed text-[#C4C7CF]">{bio}</p>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#3A3E47] px-2.5 text-[12px] font-semibold text-[#C4C7CF] hover:border-[#6E7380] hover:text-[#ECECEE]"
            >
              {PLATFORM_LABELS[l.platform] ?? l.platform}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
