// app/profil/page.tsx
"use client";

import { ETAT_BADGE } from "@/app/_composents/characters/CharacterHero";
import { useToast } from "@/app/_composents/toast/ToastProvider";
import { NotificationsSection } from "@/app/_composents/user/NotificationsSection";
import { PublishCreatorPostButton } from "@/app/_composents/user/PublishCreatorPostButton";
import { SuggestButton } from "@/app/_composents/user/SuggestEditButton";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { anton } from "@/lib/fonts";
import { cn, matchesSearch } from "@/lib/utils";
import { SignOutButton, useUser } from "@clerk/nextjs";
import {
  Check,
  ExternalLink,
  Film,
  Info,
  Link2,
  Lock,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { updateCreatorProfile } from "../onboarding/action";
import { deleteCreatorPost, requestPlayerLink } from "./actions";

type SocialLink = { platform: string; url: string };
type CreatorPost = {
  id: string;
  status: string;
  imageUrl: string | null;
  linkUrl: string | null;
  platform: string | null;
  caption: string | null;
  createdAt: string;
  characters: { id: string; nom: string }[];
};
type CreatorRole = {
  type: "ARTISTE" | "EDITEUR";
  displayOnWiki: boolean;
  status?: string;
  bio: string | null;
  socialLinks: SocialLink[];
  posts: CreatorPost[];
};
type Suggestion = {
  id: string;
  nom: string;
  createdAt: string;
  status: string;
  rejectReason: string | null;
  moderatorMessage: string | null;
};
type PlayerCharacter = {
  id: string;
  nom: string;
  imageUrl: string | null;
  etatVie: "EN_VIE" | "MORT" | "PARTI" | "DISPARU" | "PRISON";
  version: { id: string; color: string } | null;
};

type MeData = {
  pseudo: string;
  avatarUrl: string | null;
  provider: string | null;
  points: number;
  badges: string[];
  stats: { pending: number; accepted: number; rejected: number };
  playerId: string | null;
  player: { id: string; pseudo: string } | null;
  pendingLinkRequest: { playerPseudo: string } | null;
  playerCharacters: PlayerCharacter[];
  suggestions: Suggestion[];
  creatorRoles: CreatorRole[];
};

type PlayerOption = { id: string; pseudo: string };

type TabKey =
  | "public"
  | "propositions"
  | "createur"
  | "notifications"
  | "compte";

const TABS: { key: TabKey; label: string; locked: boolean }[] = [
  { key: "public", label: "Profil public", locked: false },
  { key: "propositions", label: "Mes propositions", locked: true },
  { key: "createur", label: "Profil créateur", locked: true },
  { key: "notifications", label: "Notifications", locked: true },
  { key: "compte", label: "Compte", locked: true },
];

const HASH_TO_TAB: Record<string, TabKey> = {
  propositions: "propositions",
  createur: "createur",
  notifications: "notifications",
};

const PLATFORMS = [
  "TWITTER",
  "TIKTOK",
  "YOUTUBE",
  "INSTAGRAM",
  "TWITCH",
  "AUTRE",
];
const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter / X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITCH: "Twitch",
  AUTRE: "Autre",
};

const PROVIDER_LABELS: Record<string, string> = {
  oauth_discord: "Discord",
  oauth_google: "Google",
  oauth_github: "GitHub",
};

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  pending: { color: "#F6B26B", label: "En attente de validation" },
  approved: { color: "#6EE7A0", label: "Validé" },
  rejected: { color: "#FF8A8E", label: "Refusé" },
};

const SUGGESTION_STYLE: Record<string, { color: string; label: string }> = {
  pending: { color: "#F6B26B", label: "En attente" },
  accepted: { color: "#6EE7A0", label: "Acceptée" },
  rejected: { color: "#FF8A8E", label: "Refusée" },
};

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const { isLoaded, isSignedIn } = useUser();
  const [data, setData] = useState<MeData | null>(null);
  const [fetched, setFetched] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<CreatorRole[]>([]);
  const toast = useToast();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>(() => {
    const fromQuery = searchParams.get("tab") as TabKey | null;
    if (fromQuery && TABS.some((t) => t.key === fromQuery)) return fromQuery;
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && HASH_TO_TAB[hash]) return HASH_TO_TAB[hash];
    }
    return "public";
  });

  function goToTab(t: TabKey) {
    setTab(t);
    router.replace(`${pathname}?tab=${t}`, { scroll: false });
  }

  const loadMe = useCallback(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setRoles(d.creatorRoles ?? []);
        setFetched(true);
      });
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    loadMe();
  }, [isLoaded, isSignedIn, loadMe]);

  const loading = isLoaded && isSignedIn && !fetched;

  async function handleDeletePost(id: string) {
    setRoles((prev) =>
      prev.map((r) => ({ ...r, posts: r.posts.filter((p) => p.id !== id) })),
    );
    try {
      await deleteCreatorPost(id);
      toast({ tone: "success", title: "Création supprimée" });
    } catch (err) {
      toast({
        tone: "error",
        title: "Suppression impossible",
        text: err instanceof Error ? err.message : undefined,
      });
      loadMe();
    }
  }

  function toggleRole(type: "ARTISTE" | "EDITEUR") {
    setRoles((prev) =>
      prev.find((r) => r.type === type)
        ? prev.filter((r) => r.type !== type)
        : [
            ...prev,
            {
              type,
              displayOnWiki: false,
              bio: null,
              socialLinks: [],
              posts: [],
            },
          ],
    );
  }

  function toggleDisplay(type: "ARTISTE" | "EDITEUR") {
    setRoles((prev) =>
      prev.map((r) =>
        r.type === type ? { ...r, displayOnWiki: !r.displayOnWiki } : r,
      ),
    );
  }

  function updateBio(type: "ARTISTE" | "EDITEUR", bio: string) {
    setRoles((prev) => prev.map((r) => (r.type === type ? { ...r, bio } : r)));
  }

  function addLink(type: "ARTISTE" | "EDITEUR") {
    setRoles((prev) =>
      prev.map((r) =>
        r.type === type
          ? {
              ...r,
              socialLinks: [...r.socialLinks, { platform: "TIKTOK", url: "" }],
            }
          : r,
      ),
    );
  }

  function updateLink(
    type: "ARTISTE" | "EDITEUR",
    i: number,
    field: keyof SocialLink,
    value: string,
  ) {
    setRoles((prev) =>
      prev.map((r) =>
        r.type === type
          ? {
              ...r,
              socialLinks: r.socialLinks.map((l, idx) =>
                idx === i ? { ...l, [field]: value } : l,
              ),
            }
          : r,
      ),
    );
  }

  function removeLink(type: "ARTISTE" | "EDITEUR", i: number) {
    setRoles((prev) =>
      prev.map((r) =>
        r.type === type
          ? { ...r, socialLinks: r.socialLinks.filter((_, idx) => idx !== i) }
          : r,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateCreatorProfile({
        roles: roles.map((r) => ({
          type: r.type,
          displayOnWiki: r.displayOnWiki,
          bio: r.bio ?? undefined,
          socialLinks: r.socialLinks.map((l) => ({
            platform: l.platform as never,
            url: l.url,
          })),
        })),
      });
      setData((prev) => (prev ? { ...prev, creatorRoles: roles } : prev));
      setEditing(false);
      toast({ tone: "success", title: "Profil créateur enregistré" });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
        <main className="mx-auto flex max-w-295 flex-col items-center gap-3 px-4 py-20 text-center sm:px-5">
          <h1
            className={cn(
              anton.className,
              "text-[clamp(40px,8vw,64px)] uppercase",
            )}
          >
            Mon profil
          </h1>
          <p className="text-[15px] text-[#9AA0AA]">
            Connecte-toi pour voir tes statistiques et gérer ton compte.
          </p>
          <Link
            href="/sign-in?redirect_url=/profil"
            className="mt-2 inline-flex min-h-11 items-center rounded-md bg-[#2F6FEB] px-5 text-[14px] font-bold text-white hover:bg-[#2F6FEB]/90"
          >
            Se connecter
          </Link>
        </main>
      </div>
    );
  }

  const totalCreations = roles.reduce((n, r) => n + r.posts.length, 0);
  const hasApprovedRole = (data?.creatorRoles ?? []).some(
    (r) => r.status === "approved",
  );
  const approvedRole = roles.find((r) => r.status === "approved");

  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      {/* Bannière */}
      <div
        className="h-35 w-full sm:h-50"
        style={{
          background: hasApprovedRole
            ? "linear-gradient(135deg, #2F6FEB, #0E0F12)"
            : "repeating-linear-gradient(135deg, #1A1C21 0 14px, #17191D 14px 28px)",
        }}
      />

      <main className="mx-auto flex max-w-295 flex-col gap-7 px-4 pb-14 sm:px-5">
        {/* En-tête : identité */}
        <section className="-mt-14 flex flex-wrap items-end gap-4">
          <span className="flex h-22 w-22 flex-none items-center justify-center overflow-hidden rounded-full border-[5px] border-[#0E0F12] bg-[#22252B] sm:h-30 sm:w-30">
            {loading ? null : data?.avatarUrl ? (
              <Image
                src={data.avatarUrl}
                width={120}
                height={120}
                alt=""
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-[#9AA0AA]" />
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2 pb-1">
            {loading ? (
              <div className="flex flex-col gap-2">
                <div className="h-12 w-56 animate-pulse rounded bg-[#22252B]" />
                <div className="h-5 w-32 animate-pulse rounded bg-[#22252B]" />
              </div>
            ) : (
              <>
                <h1
                  className={cn(
                    anton.className,
                    "m-0 text-[clamp(44px,6vw,72px)] uppercase leading-[0.95]",
                  )}
                >
                  {data?.pseudo}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {hasApprovedRole && (
                    <ProfilePill bg="#2A2113" color="#F6B26B">
                      Créateur
                    </ProfilePill>
                  )}
                  <ProfilePill bg="#13213A" color="#8AB4FF">
                    Contributeur · {data?.stats.accepted ?? 0} ajout
                    {(data?.stats.accepted ?? 0) > 1 ? "s" : ""} validé
                    {(data?.stats.accepted ?? 0) > 1 ? "s" : ""}
                  </ProfilePill>
                  {data?.playerId && data.player && (
                    <Link href={`/joueurs/${data.player.id}`}>
                      <ProfilePill bg="#1F1530" color="#C9A8FF">
                        Joueur : {data.player.pseudo} →
                      </ProfilePill>
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {!loading && data && (
          <>
            {/* Bandeau d'info */}
            <div className="flex items-start gap-2.5 rounded-[10px] bg-[#13213A] px-3.5 py-3 text-[14px] text-[#CFE0FF]">
              <Info className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
              <p className="m-0">
                C&apos;est ton profil. Les onglets avec un cadenas ne sont
                visibles que par toi.
              </p>
            </div>

            {/* Onglets */}
            <div
              role="tablist"
              aria-label="Sections du profil"
              className="flex gap-2 overflow-x-auto border-b border-[#23262D] pb-3.5"
            >
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => goToTab(t.key)}
                    className={cn(
                      "flex min-h-11 flex-none items-center gap-1.5 rounded-lg border px-4 text-[14px] font-bold whitespace-nowrap",
                      active
                        ? "border-[#ECECEE] bg-[#ECECEE] text-[#0E0F12]"
                        : "border-[#3A3E47] text-[#C4C7CF]",
                    )}
                  >
                    {t.label}
                    {t.locked && (
                      <Lock aria-label="Privé" className="h-3.5 w-3.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Profil public */}
            {tab === "public" && (
              <div className="flex flex-col gap-7">
                <section
                  aria-label="Informations publiques"
                  className="flex flex-wrap gap-5"
                >
                  <div className="flex min-w-65 flex-1 flex-col gap-2.5 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
                    <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-[#A3A8B3]">
                      Bio
                    </p>
                    {approvedRole?.bio ? (
                      <p className="m-0 text-[17px] text-[#D5D7DD]">
                        {approvedRole.bio}
                      </p>
                    ) : (
                      <p className="m-0 text-[17px] text-[#9AA0AA]">
                        Pas encore de bio.{" "}
                        <button
                          onClick={() => goToTab("createur")}
                          className="font-semibold text-[#8AB4FF] hover:underline"
                        >
                          Ajouter
                        </button>
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-65 flex-1 flex-wrap gap-6 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
                    <Stat value={data.stats.accepted} label="Ajouts validés" />
                    <Stat value={data.points} label="Points" />
                    <Stat value={totalCreations} label="Créations" />
                  </div>
                </section>

                {/* Ses personnages */}
                {data.playerId && (
                  <section
                    aria-labelledby="persos-h"
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h2
                        id="persos-h"
                        className={cn(
                          anton.className,
                          "m-0 text-[28px] uppercase tracking-[0.02em]",
                        )}
                      >
                        Ses personnages
                      </h2>
                      <Link
                        href={`/joueurs/${data.playerId}`}
                        className="text-[13px] font-semibold text-[#8AB4FF] hover:underline"
                      >
                        Voir sa fiche joueur →
                      </Link>
                    </div>
                    {data.playerCharacters.length === 0 ? (
                      <p className="text-[13px] text-[#9AA0AA]">
                        Aucun personnage lié pour l&apos;instant.
                      </p>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
                        {data.playerCharacters.map((c) => {
                          const dead = c.etatVie === "MORT";
                          const etat =
                            c.etatVie !== "EN_VIE"
                              ? ETAT_BADGE[c.etatVie]
                              : null;
                          return (
                            <Link
                              key={c.id}
                              href={`/personnages/${c.id}`}
                              className="relative flex h-50 flex-col justify-end overflow-hidden rounded-[10px] border border-[#23262D] bg-[#15171B] hover:border-[#3A3E47]"
                            >
                              {c.imageUrl && (
                                <Image
                                  src={cloudinaryUrl(
                                    c.imageUrl,
                                    "w_400,h_500,c_fill,g_face",
                                  )}
                                  alt=""
                                  fill
                                  unoptimized
                                  sizes="200px"
                                  className={cn(
                                    "object-cover",
                                    dead && "grayscale",
                                  )}
                                />
                              )}
                              <div className="absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-[#0E0F12] from-10% to-transparent" />
                              {etat && (
                                <span
                                  className={cn(
                                    "absolute right-2 top-2 rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                                    etat.className,
                                  )}
                                >
                                  {etat.label}
                                </span>
                              )}
                              {c.version && (
                                <span
                                  className="absolute left-2 top-2 rounded bg-[#0E0F12]/80 px-1.5 py-0.5 text-[11px] font-bold"
                                  style={{ color: c.version.color }}
                                >
                                  {c.version.id}
                                </span>
                              )}
                              <div className="relative flex flex-col px-3 pb-3">
                                <span className="text-[16px] font-bold leading-tight text-[#ECECEE]">
                                  {c.nom}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* Ses créations */}
                <section
                  aria-labelledby="creations-h"
                  className="flex flex-col gap-4"
                >
                  <h2
                    id="creations-h"
                    className={cn(
                      anton.className,
                      "m-0 text-[28px] uppercase tracking-[0.02em]",
                    )}
                  >
                    Ses créations
                  </h2>
                  {totalCreations === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-[#3A3E47] px-5 py-8 text-center">
                      <p className="m-0 text-[13px] text-[#9AA0AA]">
                        Aucune création pour l&apos;instant.
                      </p>
                      {roles.some((r) => r.status === "approved") && (
                        <PublishCreatorPostButton
                          onPublished={loadMe}
                          className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#3A3E47] px-3.5 text-[13px] font-semibold text-[#ECECEE] hover:border-[#6E7380]"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
                      {roles
                        .flatMap((r) => r.posts)
                        .map((post) => (
                          <div
                            key={post.id}
                            className="group relative aspect-square overflow-hidden rounded-[10px] border border-[#23262D] bg-[#15171B]"
                          >
                            {post.imageUrl ? (
                              <Image
                                src={cloudinaryUrl(
                                  post.imageUrl,
                                  "w_300,c_fill",
                                )}
                                alt={post.caption ?? ""}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <a
                                href={post.linkUrl ?? "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center"
                              >
                                <ExternalLink className="h-4 w-4 text-[#8AB4FF]" />
                                <span className="text-[10px] text-[#9AA0AA]">
                                  {post.platform
                                    ? PLATFORM_LABELS[post.platform]
                                    : "Lien"}
                                </span>
                              </a>
                            )}
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              aria-label="Supprimer cette création"
                              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            {post.characters.length > 0 && (
                              <span className="absolute bottom-1 left-1 right-1 truncate rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                                {post.characters.map((c) => c.nom).join(", ")}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Mes propositions */}
            {tab === "propositions" && (
              <section
                id="propositions"
                aria-labelledby="props-h"
                className="flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2
                    id="props-h"
                    className={cn(
                      anton.className,
                      "m-0 text-[28px] uppercase tracking-[0.02em]",
                    )}
                  >
                    Mes propositions
                  </h2>
                  <SuggestButton
                    mode="create"
                    renderTrigger={(onClick) => (
                      <button
                        onClick={onClick}
                        className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#3A3E47] px-3.5 text-[14px] font-bold text-[#ECECEE] hover:border-[#6E7380]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Proposer un personnage
                      </button>
                    )}
                  />
                </div>

                {data.suggestions.length === 0 ? (
                  <p className="rounded-[10px] border border-dashed border-[#3A3E47] px-5 py-8 text-center text-[13px] text-[#9AA0AA]">
                    Aucune proposition envoyée pour l&apos;instant.
                  </p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {data.suggestions.map((s) => {
                      const style =
                        SUGGESTION_STYLE[s.status] ?? SUGGESTION_STYLE.pending;
                      return (
                        <li
                          key={s.id}
                          className="flex flex-col gap-1.5 rounded-[10px] border border-[#23262D] bg-[#15171B] px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[14px] font-semibold text-[#ECECEE]">
                              {s.nom}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] text-[#9AA0AA]">
                                {new Date(s.createdAt).toLocaleDateString(
                                  "fr-FR",
                                )}
                              </span>
                              <span
                                className="rounded-full border px-2 py-0.5 text-[11px] font-bold"
                                style={{
                                  color: style.color,
                                  borderColor: `${style.color}60`,
                                }}
                              >
                                {style.label}
                              </span>
                            </div>
                          </div>
                          {s.status === "rejected" &&
                            (s.rejectReason || s.moderatorMessage) && (
                              <div className="flex flex-col gap-0.5 text-[13px] text-[#C4C7CF]">
                                {s.rejectReason && (
                                  <span>
                                    Motif :{" "}
                                    <span className="text-[#FF8A8E]">
                                      {s.rejectReason}
                                    </span>
                                  </span>
                                )}
                                {s.moderatorMessage && (
                                  <span>{s.moderatorMessage}</span>
                                )}
                              </div>
                            )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {/* Profil créateur */}
            {tab === "createur" && (
              <section
                id="createur"
                aria-labelledby="createur-h"
                className="flex max-w-190 flex-col gap-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2
                    id="createur-h"
                    className={cn(
                      anton.className,
                      "m-0 text-[28px] uppercase tracking-[0.02em]",
                    )}
                  >
                    Profil créateur
                  </h2>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#3A3E47] px-3.5 text-[14px] font-bold text-[#C4C7CF] hover:border-[#6E7380] hover:text-[#ECECEE]"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
                  <label
                    className={cn(
                      "flex items-center gap-2 text-[14px] font-semibold text-[#ECECEE]",
                      editing ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={roles.some((r) => r.displayOnWiki)}
                      disabled={!editing}
                      onChange={() =>
                        roles.forEach((r) => toggleDisplay(r.type))
                      }
                      className="accent-[#2F6FEB]"
                    />
                    Apparaître sur la page Créations
                  </label>
                  <p className="m-0 text-[13px] text-[#9AA0AA]">
                    Tes créations validées s&apos;affichent dans la galerie avec
                    ton nom.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-[#A3A8B3]">
                    Rôle créateur
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {(["ARTISTE", "EDITEUR"] as const).map((type) => {
                      const role = roles.find((r) => r.type === type);
                      const active = !!role;
                      const statusStyle = role?.status
                        ? STATUS_STYLE[role.status]
                        : null;
                      return (
                        <button
                          key={type}
                          disabled={!editing}
                          onClick={() => toggleRole(type)}
                          className={cn(
                            "flex min-w-55 flex-1 flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
                            active
                              ? "border-[#2F6FEB]/60 bg-[#2F6FEB]/10"
                              : "border-[#23262D] bg-[#15171B]",
                            editing ? "cursor-pointer" : "cursor-default",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {type === "ARTISTE" ? (
                              <Sparkles className="h-4 w-4 text-[#E5A3F0]" />
                            ) : (
                              <Film className="h-4 w-4 text-[#8AB4FF]" />
                            )}
                            <span className="text-[15px] font-bold text-[#ECECEE]">
                              {type === "ARTISTE"
                                ? "Artiste (fan art)"
                                : "Edit-maker"}
                            </span>
                          </div>
                          {statusStyle && (
                            <span
                              className="w-fit rounded-full border px-2 py-0.5 text-[11px] font-bold"
                              style={{
                                color: statusStyle.color,
                                borderColor: `${statusStyle.color}60`,
                              }}
                            >
                              {statusStyle.label}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {roles.map((role) => (
                  <div
                    key={role.type}
                    className="flex flex-col gap-3 rounded-xl border border-[#23262D] bg-[#15171B] p-5"
                  >
                    <div className="flex items-center gap-2">
                      {role.type === "ARTISTE" ? (
                        <Sparkles className="h-3.5 w-3.5 text-[#E5A3F0]" />
                      ) : (
                        <Film className="h-3.5 w-3.5 text-[#8AB4FF]" />
                      )}
                      <span className="text-[14px] font-semibold text-[#ECECEE]">
                        {role.type === "ARTISTE" ? "Fan art" : "Edits"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[13px] font-semibold uppercase tracking-wide text-[#9AA0AA]">
                        Bio
                      </label>
                      {editing ? (
                        <textarea
                          value={role.bio ?? ""}
                          onChange={(e) => updateBio(role.type, e.target.value)}
                          placeholder="Un mot sur toi et ce que tu crées…"
                          className="h-24 resize-none rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 py-2 text-[14px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
                        />
                      ) : (
                        <p className="text-[14px] text-[#C4C7CF]">
                          {role.bio || "Aucune bio renseignée."}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wide text-[#9AA0AA]">
                        <Link2 className="h-2.5 w-2.5" />
                        Réseaux
                      </p>
                      {!editing ? (
                        role.socialLinks.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {role.socialLinks.map((l, i) => (
                              <a
                                key={i}
                                href={l.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md border border-[#3A3E47] px-2 py-0.5 text-[13px] text-[#C4C7CF] hover:text-[#ECECEE]"
                              >
                                {PLATFORM_LABELS[l.platform] ?? l.platform}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[13px] text-[#9AA0AA]">
                            Aucun lien renseigné.
                          </p>
                        )
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {role.socialLinks.map((link, i) => (
                            <div key={i} className="flex gap-2">
                              <select
                                value={link.platform}
                                onChange={(e) =>
                                  updateLink(
                                    role.type,
                                    i,
                                    "platform",
                                    e.target.value,
                                  )
                                }
                                className="h-12 rounded-md border border-[#3A3E47] bg-[#0E0F12] px-2 text-[14px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
                              >
                                {PLATFORMS.map((p) => (
                                  <option key={p} value={p}>
                                    {PLATFORM_LABELS[p]}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) =>
                                  updateLink(
                                    role.type,
                                    i,
                                    "url",
                                    e.target.value,
                                  )
                                }
                                placeholder="https://..."
                                aria-label="URL du lien"
                                className="h-12 flex-1 rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 text-[14px] text-[#ECECEE] placeholder-[#6E7380] outline-none focus:border-[#2F6FEB]"
                              />
                              <button
                                onClick={() => removeLink(role.type, i)}
                                aria-label="Retirer ce lien"
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[#3A3E47] text-[#9AA0AA] hover:text-[#FF8A8E]"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addLink(role.type)}
                            className="flex items-center gap-1.5 text-[14px] font-semibold text-[#8AB4FF] hover:underline"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter un lien
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {roles.length === 0 && !editing && (
                  <p className="text-[14px] text-[#9AA0AA]">
                    Aucun rôle créateur défini.
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  {editing && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex min-h-11 items-center gap-1.5 rounded-md bg-[#2F6FEB] px-4 text-[14px] font-bold text-white hover:bg-[#2F6FEB]/90 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {saving ? "…" : "Enregistrer"}
                    </button>
                  )}
                  {roles.some((r) => r.status === "approved") && (
                    <PublishCreatorPostButton
                      allowedTypes={roles
                        .filter((r) => r.status === "approved")
                        .map((r) => r.type)}
                      onPublished={loadMe}
                      className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#3A3E47] px-3.5 text-[14px] font-bold text-[#ECECEE] hover:border-[#6E7380]"
                    />
                  )}
                </div>
              </section>
            )}

            {/* Notifications */}
            {tab === "notifications" && <NotificationsSection />}

            {/* Compte */}
            {tab === "compte" && (
              <AccountSection data={data} onLinked={loadMe} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function AccountSection({
  data,
  onLinked,
}: {
  data: MeData;
  onLinked: () => void;
}) {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (data.playerId) return;
    fetch("/api/players")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(() => setPlayers([]));
  }, [data.playerId]);

  const matches = query.trim()
    ? players.filter((p) => matchesSearch(p.pseudo, query)).slice(0, 8)
    : [];

  async function handleRequest(playerId: string) {
    setLinking(true);
    setError(null);
    try {
      await requestPlayerLink(playerId);
      setQuery("");
      onLinked();
      toast({
        tone: "success",
        title: "Demande envoyée",
        text: "Un admin va vérifier ta demande de lien.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(message);
      toast({ tone: "error", title: "Demande impossible", text: message });
    } finally {
      setLinking(false);
    }
  }

  return (
    <section
      aria-labelledby="compte-h"
      className="flex max-w-190 flex-col gap-5"
    >
      <h2
        id="compte-h"
        className={cn(
          anton.className,
          "m-0 text-[28px] uppercase tracking-[0.02em]",
        )}
      >
        Compte
      </h2>

      <div className="flex items-center gap-3 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
        <span className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full bg-[#22252B]">
          {data.avatarUrl ? (
            <Image
              src={data.avatarUrl}
              width={56}
              height={56}
              alt=""
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-6 w-6 text-[#9AA0AA]" />
          )}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-semibold text-[#ECECEE]">
            {data.pseudo}
          </span>
          <span className="text-[13px] text-[#9AA0AA]">
            Connecté avec{" "}
            {(data.provider && PROVIDER_LABELS[data.provider]) || "e-mail"}
          </span>
        </div>
      </div>

      {data.playerId && data.player ? null : data.pendingLinkRequest ? (
        <div className="flex flex-col gap-2 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
          <p className="m-0 text-[14px] font-semibold text-[#ECECEE]">
            Lier mon compte à ma fiche joueur
          </p>
          <span className="w-fit rounded-full bg-[#2A2113] px-2.5 py-1 text-[12px] font-bold text-[#F6B26B]">
            Demande en attente de validation
          </span>
          <p className="m-0 text-[13px] text-[#9AA0AA]">
            Fiche demandée : {data.pendingLinkRequest.playerPseudo}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
          <p className="m-0 text-[14px] font-semibold text-[#ECECEE]">
            Lier mon compte à ma fiche joueur
          </p>
          <p className="m-0 text-[13px] text-[#9AA0AA]">
            Si tu joues sur Flashback, relie ton compte à ta fiche pour pouvoir
            la modifier et afficher le badge Joueur.
          </p>
          <div className="relative flex flex-col gap-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une fiche joueur…"
              aria-label="Rechercher une fiche joueur"
              className="h-12 rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 text-[14px] text-[#ECECEE] placeholder-[#6E7380] outline-none focus:border-[#2F6FEB]"
            />
            {matches.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {matches.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => handleRequest(p.id)}
                      disabled={linking}
                      className="flex min-h-11 w-full items-center justify-between rounded-md border border-[#23262D] bg-[#0E0F12] px-3 text-[14px] text-[#ECECEE] hover:border-[#6E7380] disabled:opacity-50"
                    >
                      {p.pseudo}
                      <span className="text-[12px] font-bold text-[#8AB4FF]">
                        Demander le lien
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="text-[13px] text-[#FF8A8E]">{error}</p>}
          </div>
        </div>
      )}

      <SignOutButton>
        <button className="mt-2 flex min-h-11 w-fit items-center gap-1.5 rounded-md border border-[#3A3E47] px-3.5 text-[14px] font-bold text-[#C4C7CF] hover:border-[#6E7380] hover:text-[#ECECEE]">
          <LogOut className="h-3.5 w-3.5" />
          Se déconnecter
        </button>
      </SignOutButton>
    </section>
  );
}

function ProfilePill({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="rounded-full px-2.5 py-0.75 text-[12px] font-bold"
      style={{ backgroundColor: bg, color }}
    >
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span
        className={cn(
          anton.className,
          "text-[32px] leading-none text-[#ECECEE]",
        )}
      >
        {value}
      </span>
      <span className="text-[12px] uppercase tracking-widest text-[#A3A8B3]">
        {label}
      </span>
    </div>
  );
}
