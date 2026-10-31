"use client";

import { useToast } from "@/app/_composents/toast/ToastProvider";
import { BadgePill } from "@/app/_composents/user/badges";
import { NotificationsSection } from "@/app/_composents/user/NotificationsSection";
import {
  ProfileCharacters,
  ProfilePill,
  Stat,
  type ProfileCharacter,
} from "@/app/_composents/user/ProfileParts";
import { PublishCreatorPostButton } from "@/app/_composents/user/PublishCreatorPostButton";
import { SuggestButton } from "@/app/_composents/user/SuggestEditButton";
import { invalidateProfilesCache } from "@/lib/actions";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { anton } from "@/lib/fonts";
import { cn, matchesSearch, profileHref } from "@/lib/utils";
import { SignOutButton, useUser } from "@clerk/nextjs";
import type { SocialPlatform } from "@prisma/client";
import {
  Camera,
  Check,
  Eye,
  ExternalLink,
  Info,
  Lock,
  LogOut,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { updateCreatorProfile } from "../onboarding/action";
import {
  deleteCreatorPost,
  requestPlayerLink,
  updatePublicProfile,
  updateSocialLinks,
} from "./actions";

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
type MeData = {
  pseudo: string;
  profilePseudo: string | null;
  bio: string | null;
  socialLinks: SocialLink[];
  profilePublic: boolean;
  showStats: boolean;
  avatarUrl: string | null;
  provider: string | null;
  points: number;
  badges: string[];
  stats: { pending: number; accepted: number; rejected: number };
  playerId: string | null;
  player: { id: string; pseudo: string } | null;
  pendingLinkRequest: { playerPseudo: string } | null;
  playerCharacters: ProfileCharacter[];
  suggestions: Suggestion[];
  creatorRoles: CreatorRole[];
};

type PlayerOption = { id: string; pseudo: string };

type TabKey = "public" | "propositions" | "notifications" | "compte";

const TABS: { key: TabKey; label: string; locked: boolean }[] = [
  { key: "public", label: "Profil public", locked: false },
  { key: "propositions", label: "Mes propositions", locked: true },
  { key: "notifications", label: "Notifications", locked: true },
  { key: "compte", label: "Compte", locked: true },
];

const HASH_TO_TAB: Record<string, TabKey> = {
  propositions: "propositions",
  createur: "public",
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

  async function toggleDisplayOnWiki() {
    const previous = roles;
    const next = !roles.some((r) => r.displayOnWiki);
    const updated = roles.map((r) => ({ ...r, displayOnWiki: next }));
    setRoles(updated);
    try {
      await updateCreatorProfile({
        roles: updated.map((r) => ({
          type: r.type,
          displayOnWiki: r.displayOnWiki,
        })),
      });
      toast({
        tone: "success",
        title: next
          ? "Visible sur la page Créations"
          : "Masqué de la page Créations",
      });
    } catch (err) {
      setRoles(previous);
      toast({
        tone: "error",
        title: "Enregistrement impossible",
        text: err instanceof Error ? err.message : undefined,
      });
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
  const isCreator = roles.length > 0;

  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      {/* Bannière */}
      <div
        className="h-35 w-full sm:h-50"
        style={{
          background: isCreator
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
                  {isCreator && (
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
                {data.profilePseudo && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#23262D] bg-[#15171B] px-4 py-3">
                    <p className="m-0 text-[14px] text-[#C4C7CF]">
                      {data.profilePublic
                        ? "Voici ce que les autres membres voient de toi."
                        : "Ton profil public est masqué : personne d'autre ne le voit."}
                    </p>
                    {data.profilePublic && (
                      <Link
                        href={profileHref(data.profilePseudo)}
                        className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#3A3E47] px-3.5 text-[14px] font-bold text-[#ECECEE] hover:border-[#6E7380]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Voir mon profil public
                      </Link>
                    )}
                  </div>
                )}

                <section
                  aria-label="Informations publiques"
                  className="flex flex-wrap gap-5"
                >
                  <BioCard
                    data={data}
                    onSaved={(bio) =>
                      setData((prev) => (prev ? { ...prev, bio } : prev))
                    }
                  />

                  <SocialLinksCard
                    data={data}
                    onSaved={(socialLinks) =>
                      setData((prev) =>
                        prev ? { ...prev, socialLinks } : prev,
                      )
                    }
                  />

                  <div className="flex min-w-65 flex-1 flex-col gap-3 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
                    <div className="flex flex-wrap gap-6">
                      <Stat
                        value={data.stats.accepted}
                        label="Ajouts validés"
                      />
                      <Stat value={data.points} label="Points" />
                      <Stat value={totalCreations} label="Créations" />
                    </div>
                    {!data.showStats && (
                      <p className="m-0 text-[13px] text-[#9AA0AA]">
                        Masquées sur ton profil public.{" "}
                        <button
                          onClick={() => goToTab("compte")}
                          className="font-semibold text-[#8AB4FF] hover:underline"
                        >
                          Modifier
                        </button>
                      </p>
                    )}
                  </div>
                </section>

                {data.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.badges.map((b) => (
                      <BadgePill key={b} badgeKey={b} />
                    ))}
                  </div>
                )}

                {data.playerId && (
                  <ProfileCharacters
                    playerId={data.playerId}
                    characters={data.playerCharacters}
                  />
                )}

                {/* Ses créations */}
                <section
                  aria-labelledby="creations-h"
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2
                      id="creations-h"
                      className={cn(
                        anton.className,
                        "m-0 text-[28px] uppercase tracking-[0.02em]",
                      )}
                    >
                      Ses créations
                    </h2>
                    {totalCreations > 0 && (
                      <PublishCreatorPostButton
                        onPublished={loadMe}
                        className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#3A3E47] px-3.5 text-[13px] font-semibold text-[#ECECEE] hover:border-[#6E7380]"
                      />
                    )}
                  </div>

                  {roles.length > 0 && (
                    <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#ECECEE]">
                      <input
                        type="checkbox"
                        checked={roles.some((r) => r.displayOnWiki)}
                        onChange={toggleDisplayOnWiki}
                        className="accent-[#2F6FEB]"
                      />
                      Apparaître sur la page Créations
                    </label>
                  )}

                  {totalCreations === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-[#3A3E47] px-5 py-8 text-center">
                      <p className="m-0 text-[13px] text-[#9AA0AA]">
                        Aucune création pour l&apos;instant.
                      </p>
                      <PublishCreatorPostButton
                        onPublished={loadMe}
                        className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#3A3E47] px-3.5 text-[13px] font-semibold text-[#ECECEE] hover:border-[#6E7380]"
                      />
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

      <AvatarSettings data={data} onSaved={onLinked} />

      <VisibilitySettings data={data} onSaved={onLinked} />

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

function BioCard({
  data,
  onSaved,
}: {
  data: MeData;
  onSaved: (bio: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(data.bio ?? "");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function handleSave() {
    setSaving(true);
    try {
      await updatePublicProfile({
        bio,
        profilePublic: data.profilePublic,
        showStats: data.showStats,
      });
      onSaved(bio.trim() || null);
      setEditing(false);
      toast({ tone: "success", title: "Bio enregistrée" });
    } catch (err) {
      toast({
        tone: "error",
        title: "Enregistrement impossible",
        text: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-w-65 flex-1 flex-col gap-2.5 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-[#A3A8B3]">
          Bio
        </p>
        {!editing && data.bio && (
          <button
            onClick={() => setEditing(true)}
            className="text-[13px] font-semibold text-[#8AB4FF] hover:underline"
          >
            Modifier
          </button>
        )}
      </div>
      {editing ? (
        <>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            placeholder="Un mot sur toi…"
            aria-label="Bio"
            className="h-28 resize-none rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 py-2 text-[15px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex min-h-11 items-center gap-1.5 rounded-md bg-[#2F6FEB] px-4 text-[14px] font-bold text-white hover:bg-[#2F6FEB]/90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? "…" : "Enregistrer"}
            </button>
            <button
              onClick={() => {
                setBio(data.bio ?? "");
                setEditing(false);
              }}
              className="flex min-h-11 items-center rounded-md border border-[#3A3E47] px-3.5 text-[14px] font-bold text-[#C4C7CF] hover:border-[#6E7380]"
            >
              Annuler
            </button>
          </div>
        </>
      ) : data.bio ? (
        <p className="m-0 whitespace-pre-line text-[17px] text-[#D5D7DD]">
          {data.bio}
        </p>
      ) : (
        <p className="m-0 text-[17px] text-[#9AA0AA]">
          Pas encore de bio.{" "}
          <button
            onClick={() => setEditing(true)}
            className="font-semibold text-[#8AB4FF] hover:underline"
          >
            Ajouter
          </button>
        </p>
      )}
    </div>
  );
}

function SocialLinksCard({
  data,
  onSaved,
}: {
  data: MeData;
  onSaved: (socialLinks: SocialLink[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [links, setLinks] = useState<SocialLink[]>(data.socialLinks);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  function addLink() {
    setLinks((prev) => [...prev, { platform: PLATFORMS[0], url: "" }]);
  }
  function updateLink(i: number, patch: Partial<SocialLink>) {
    setLinks((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    );
  }
  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const cleaned = links
        .map((l) => ({
          platform: l.platform as SocialPlatform,
          url: l.url.trim(),
        }))
        .filter((l) => l.url !== "");
      await updateSocialLinks(cleaned);
      onSaved(cleaned);
      setEditing(false);
      toast({ tone: "success", title: "Réseaux enregistrés" });
    } catch (err) {
      toast({
        tone: "error",
        title: "Enregistrement impossible",
        text: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-w-65 flex-1 flex-col gap-2.5 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-[#A3A8B3]">
          Réseaux
        </p>
        {!editing && data.socialLinks.length > 0 && (
          <button
            onClick={() => {
              setLinks(data.socialLinks);
              setEditing(true);
            }}
            className="text-[13px] font-semibold text-[#8AB4FF] hover:underline"
          >
            Modifier
          </button>
        )}
      </div>

      {editing ? (
        <>
          <div className="flex flex-col gap-2">
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={l.platform}
                  onChange={(e) => updateLink(i, { platform: e.target.value })}
                  aria-label="Plateforme"
                  className="min-h-10 rounded-md border border-[#3A3E47] bg-[#0E0F12] px-2 text-[13px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_LABELS[p]}
                    </option>
                  ))}
                </select>
                <input
                  value={l.url}
                  onChange={(e) => updateLink(i, { url: e.target.value })}
                  placeholder="https://…"
                  aria-label="URL"
                  className="min-h-10 flex-1 rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 text-[13px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
                />
                <button
                  onClick={() => removeLink(i)}
                  aria-label="Retirer ce lien"
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-md border border-[#3A3E47] text-[#9AA0AA] hover:border-[#FF8A8E] hover:text-[#FF8A8E]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addLink}
            className="flex min-h-9 w-fit items-center gap-1.5 rounded-md border border-[#3A3E47] px-3 text-[13px] font-semibold text-[#C4C7CF] hover:border-[#6E7380]"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un lien
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex min-h-11 items-center gap-1.5 rounded-md bg-[#2F6FEB] px-4 text-[14px] font-bold text-white hover:bg-[#2F6FEB]/90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? "…" : "Enregistrer"}
            </button>
            <button
              onClick={() => {
                setLinks(data.socialLinks);
                setEditing(false);
              }}
              className="flex min-h-11 items-center rounded-md border border-[#3A3E47] px-3.5 text-[14px] font-bold text-[#C4C7CF] hover:border-[#6E7380]"
            >
              Annuler
            </button>
          </div>
        </>
      ) : data.socialLinks.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {data.socialLinks.map((l, i) => (
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
      ) : (
        <p className="m-0 text-[17px] text-[#9AA0AA]">
          Aucun réseau ajouté.{" "}
          <button
            onClick={() => {
              setLinks([{ platform: PLATFORMS[0], url: "" }]);
              setEditing(true);
            }}
            className="font-semibold text-[#8AB4FF] hover:underline"
          >
            Ajouter
          </button>
        </p>
      )}
    </div>
  );
}

const AVATAR_MAX_BYTES = 10 * 1024 * 1024;

/** Photo de profil : stockée chez Clerk, donc reprise partout sur le site. */
function AvatarSettings({
  data,
  onSaved,
}: {
  data: MeData;
  onSaved: () => void;
}) {
  const { user } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function apply(file: File | null) {
    if (!user) return;
    if (file && !file.type.startsWith("image/")) {
      toast({ tone: "error", title: "Ce fichier n'est pas une image" });
      return;
    }
    if (file && file.size > AVATAR_MAX_BYTES) {
      toast({
        tone: "error",
        title: "Image trop lourde",
        text: "10 Mo maximum.",
      });
      return;
    }
    setSaving(true);
    try {
      await user.setProfileImage({ file });
      await invalidateProfilesCache();
      onSaved();
      toast({
        tone: "success",
        title: file ? "Photo de profil mise à jour" : "Photo de profil retirée",
      });
    } catch (err) {
      toast({
        tone: "error",
        title: "Changement impossible",
        text: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={saving}
        aria-label="Changer la photo de profil"
        className="group relative flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full bg-[#22252B] disabled:opacity-50"
      >
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
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </span>
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[14px] font-semibold text-[#ECECEE]">
          {data.pseudo}
        </span>
        <span className="text-[13px] text-[#9AA0AA]">
          Connecté avec{" "}
          {(data.provider && PROVIDER_LABELS[data.provider]) || "e-mail"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={saving}
          className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#3A3E47] px-3.5 text-[14px] font-bold text-[#ECECEE] hover:border-[#6E7380] disabled:opacity-50"
        >
          <Camera className="h-3.5 w-3.5" />
          {saving ? "…" : "Changer la photo"}
        </button>
        {user?.hasImage && (
          <button
            type="button"
            onClick={() => apply(null)}
            disabled={saving}
            className="flex min-h-11 items-center rounded-md px-3 text-[14px] font-bold text-[#9AA0AA] hover:text-[#FF8A8E] disabled:opacity-50"
          >
            Retirer
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) apply(file);
        }}
      />
    </div>
  );
}

function VisibilitySettings({
  data,
  onSaved,
}: {
  data: MeData;
  onSaved: () => void;
}) {
  const [profilePublic, setProfilePublic] = useState(data.profilePublic);
  const [showStats, setShowStats] = useState(data.showStats);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save(next: { profilePublic: boolean; showStats: boolean }) {
    setProfilePublic(next.profilePublic);
    setShowStats(next.showStats);
    setSaving(true);
    try {
      await updatePublicProfile({ bio: data.bio ?? "", ...next });
      onSaved();
    } catch (err) {
      setProfilePublic(data.profilePublic);
      setShowStats(data.showStats);
      toast({
        tone: "error",
        title: "Enregistrement impossible",
        text: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
      <p className="m-0 text-[14px] font-semibold text-[#ECECEE]">
        Profil public
      </p>
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={profilePublic}
          disabled={saving}
          onChange={() => save({ profilePublic: !profilePublic, showStats })}
          className="mt-1 accent-[#2F6FEB]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-[14px] text-[#ECECEE]">
            Rendre mon profil visible
          </span>
          <span className="text-[13px] text-[#9AA0AA]">
            Masqué, ta page n&apos;est plus accessible et tu n&apos;apparais
            plus dans les contributeurs des fiches.
          </span>
        </span>
      </label>
      <label
        className={cn(
          "flex items-start gap-2.5",
          profilePublic ? "cursor-pointer" : "opacity-50",
        )}
      >
        <input
          type="checkbox"
          checked={showStats}
          disabled={saving || !profilePublic}
          onChange={() => save({ profilePublic, showStats: !showStats })}
          className="mt-1 accent-[#2F6FEB]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-[14px] text-[#ECECEE]">
            Afficher mes statistiques
          </span>
          <span className="text-[13px] text-[#9AA0AA]">
            Ajouts validés, points et nombre de créations.
          </span>
        </span>
      </label>
    </div>
  );
}
