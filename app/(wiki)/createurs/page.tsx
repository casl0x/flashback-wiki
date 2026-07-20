// app/createurs/page.tsx
"use client";

import { ChevronDown, ExternalLink, Film, Sparkles, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type SocialLink = { platform: string; url: string };
type CreatorRole = { type: "ARTISTE" | "EDITEUR"; socialLinks: SocialLink[] };

type Creator = {
  id: string;
  types: ("ARTISTE" | "EDITEUR")[];
  roles: CreatorRole[];
  pseudo: string;
  avatarUrl: string | null;
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
  { key: "ARTISTE", label: "Artistes", icon: <Sparkles className="h-3 w-3" /> },
  { key: "EDITEUR", label: "Edit-makers", icon: <Film className="h-3 w-3" /> },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function CreateursPage() {
  const [data, setData] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    fetch("/api/creators")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const filtered =
    tab === "all"
      ? data
      : data.filter((c) => c.types.includes(tab as "ARTISTE" | "EDITEUR"));

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
              "Chaque demande est examinée manuellement avant d'apparaître sur la page",
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
              : data.filter((c) => c.types.includes(t.key)).length;
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-muted-foreground">
          <p className="text-sm">
            Aucun créateur dans cette catégorie pour l&apos;instant.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((c) => (
            <CreatorCard key={c.id} creator={c} activeTab={tab} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreatorCard({
  creator,
  activeTab,
}: {
  creator: Creator;
  activeTab: Tab;
}) {
  // Si un filtre est actif, n'affiche que les rôles correspondants
  const visibleRoles =
    activeTab === "all"
      ? creator.roles
      : creator.roles.filter((r) => r.type === activeTab);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/30">
      {/* Avatar + nom + badges */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted overflow-hidden">
          {creator.avatarUrl ? (
            <Image
              src={creator.avatarUrl}
              width={40}
              height={40}
              alt={creator.pseudo}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-text-primary mb-1">
            {creator.pseudo}
          </p>
          <div className="flex flex-wrap gap-1">
            {creator.types.map((type) => (
              <span
                key={type}
                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${
                  type === "ARTISTE"
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                    : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                }`}
              >
                {type === "ARTISTE" ? (
                  <>
                    <Sparkles className="h-2.5 w-2.5" /> Artiste
                  </>
                ) : (
                  <>
                    <Film className="h-2.5 w-2.5" /> Edit-maker
                  </>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Liens par rôle */}
      <div className="space-y-2">
        {visibleRoles.map((role) => (
          <div key={role.type}>
            {/* Label du rôle uniquement si les deux sont visibles */}
            {activeTab === "all" && creator.roles.length > 1 && (
              <p className="text-[9px] font-medium uppercase tracking-wide text-text-muted mb-1 flex items-center gap-1">
                {role.type === "ARTISTE" ? (
                  <>
                    <Sparkles className="h-2.5 w-2.5" /> Fan art
                  </>
                ) : (
                  <>
                    <Film className="h-2.5 w-2.5" /> Edits
                  </>
                )}
              </p>
            )}
            {role.socialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {role.socialLinks.map((l, i) => (
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
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Aucun lien renseigné.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
