"use client";

import { BadgePill } from "@/components/user/badges";
import { useUser } from "@clerk/nextjs";
import {
  Check,
  Link2,
  Pencil,
  Plus,
  Sparkles,
  Trophy,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { updateCreatorProfile } from "../onboarding/action";

type CreatorRole = { type: "ARTISTE" | "EDITEUR"; displayOnWiki: boolean };
type SocialLink = { id?: string; platform: string; url: string };

type MeData = {
  pseudo: string;
  avatarUrl: string | null;
  points: number;
  badges: string[];
  stats: { pending: number; accepted: number; rejected: number };
  creatorRoles: CreatorRole[];
  socialLinks: SocialLink[];
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

export default function ProfilePage() {
  const { isLoaded, isSignedIn } = useUser();
  const [data, setData] = useState<MeData | null>(null);
  const [fetched, setFetched] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState<CreatorRole[]>([]);
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setRoles(d.creatorRoles ?? []);
        setLinks(d.socialLinks ?? []);
        setFetched(true);
      });
  }, [isLoaded, isSignedIn]);

  const loading = isLoaded && isSignedIn && !fetched;
  const totalSuggestions = data
    ? data.stats.pending + data.stats.accepted + data.stats.rejected
    : 0;

  function toggleRole(type: "ARTISTE" | "EDITEUR") {
    setRoles((prev) =>
      prev.find((r) => r.type === type)
        ? prev.filter((r) => r.type !== type)
        : [...prev, { type, displayOnWiki: false }],
    );
  }

  function toggleDisplay(type: "ARTISTE" | "EDITEUR") {
    setRoles((prev) =>
      prev.map((r) =>
        r.type === type ? { ...r, displayOnWiki: !r.displayOnWiki } : r,
      ),
    );
  }

  function updateLink(i: number, field: keyof SocialLink, value: string) {
    setLinks((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)),
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateCreatorProfile({
        roles,
        socialLinks: links.map((l) => ({
          platform: l.platform as never,
          url: l.url,
        })),
      });
      setData((prev) =>
        prev ? { ...prev, creatorRoles: roles, socialLinks: links } : prev,
      );
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 p-4 lg:p-5">
      {/* Header profil — inchangé */}
      <div className="space-y-5 rounded-xl border border-border bg-card p-5 lg:p-8">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted overflow-hidden">
            {!loading && data?.avatarUrl ? (
              <Image
                src={data.avatarUrl}
                width={44}
                height={44}
                alt={data.pseudo}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            {loading ? (
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-32 rounded bg-elevated animate-pulse" />
                <div className="h-3 w-20 rounded bg-elevated animate-pulse" />
              </div>
            ) : !isSignedIn ? (
              <>
                <p className="text-lg font-medium">Mon profil</p>
                <p className="text-sm text-muted-foreground">
                  Connecte-toi pour voir tes stats
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">{data?.pseudo}</p>
                <p className="text-sm text-muted-foreground">
                  {data?.points ?? 0} points
                </p>
              </>
            )}
          </div>
        </div>

        {!loading && isSignedIn && (
          <div className="border-t border-border pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Badges
            </p>
            {data?.badges.length ? (
              <div className="flex flex-wrap gap-2">
                {data.badges.map((b) => (
                  <BadgePill key={b} badgeKey={b} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun badge pour l&apos;instant, peut-être qu&apos;ils
                arriveront plus tard...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats contributions — inchangé */}
      {!loading && isSignedIn && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-5 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-medium">Contributions</p>
              <p className="text-xs text-muted-foreground">
                Tes propositions de modifications
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-border pt-5">
            {[
              {
                label: "Total",
                value: totalSuggestions,
                color: "text-text-primary",
              },
              {
                label: "Acceptées",
                value: data?.stats.accepted ?? 0,
                color: "text-accent-light",
              },
              {
                label: "En attente",
                value: data?.stats.pending ?? 0,
                color: "text-amber-400",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="flex flex-col gap-1 rounded-lg border border-border bg-muted p-4"
              >
                <span className={`text-[22px] font-bold ${color}`}>
                  {value}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {(data?.stats.rejected ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              {data!.stats.rejected} proposition
              {data!.stats.rejected > 1 ? "s" : ""} refusée
              {data!.stats.rejected > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Section créateur de contenu */}
      {!loading && isSignedIn && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-5 lg:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-medium">Créateur de contenu</p>
                <p className="text-xs text-muted-foreground">
                  Fan art, edits et réseaux sociaux
                </p>
              </div>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-text-primary transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Modifier
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                {saving ? "..." : "Enregistrer"}
              </button>
            )}
          </div>

          <div className="border-t border-border pt-5 space-y-5">
            {/* Rôles */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Rôles
              </p>
              <div className="flex flex-wrap gap-2">
                {(["ARTISTE", "EDITEUR"] as const).map((type) => {
                  const role = roles.find((r) => r.type === type);
                  const active = !!role;
                  return (
                    <button
                      key={type}
                      disabled={!editing}
                      onClick={() => toggleRole(type)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-accent/40 bg-accent/10 text-accent-light"
                          : "border-border bg-muted text-muted-foreground"
                      } ${editing ? "cursor-pointer" : "cursor-default"}`}
                    >
                      {type === "ARTISTE" ? "Artiste (fan art)" : "Edit-maker"}
                    </button>
                  );
                })}
              </div>

              {roles.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {roles.map((r) => (
                    <label
                      key={r.type}
                      className={`flex items-center gap-2 text-xs ${editing ? "text-text-primary" : "text-muted-foreground"}`}
                    >
                      <input
                        type="checkbox"
                        checked={r.displayOnWiki}
                        disabled={!editing}
                        onChange={() => toggleDisplay(r.type)}
                        className="accent-accent"
                      />
                      M&apos;afficher sur la page{" "}
                      {r.type === "ARTISTE" ? "Artistes" : "Edits"} du wiki
                    </label>
                  ))}
                </div>
              )}

              {roles.length === 0 && !editing && (
                <p className="text-sm text-muted-foreground mt-2">
                  Aucun rôle créateur défini.
                </p>
              )}
            </div>

            {/* Liens */}
            <div className="border-t border-border pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <Link2 className="h-3 w-3" />
                Réseaux sociaux
              </p>

              {!editing ? (
                links.length ? (
                  <div className="flex flex-wrap gap-2">
                    {links.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:text-text-primary transition-colors"
                      >
                        {PLATFORM_LABELS[l.platform] ?? l.platform}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun lien renseigné.
                  </p>
                )
              ) : (
                <div className="space-y-2">
                  {links.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <select
                        value={link.platform}
                        onChange={(e) =>
                          updateLink(i, "platform", e.target.value)
                        }
                        className="rounded-md border border-border bg-muted px-2 text-xs text-text-primary outline-none focus:border-accent"
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
                        onChange={(e) => updateLink(i, "url", e.target.value)}
                        placeholder="https://..."
                        className="flex-1 rounded-md border border-border bg-muted px-3 text-xs text-text-primary placeholder-muted-foreground outline-none focus:border-accent"
                      />
                      <button
                        onClick={() =>
                          setLinks((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setLinks((prev) => [
                        ...prev,
                        { platform: "TWITTER", url: "" },
                      ])
                    }
                    className="flex items-center gap-1.5 text-xs font-medium text-accent-light hover:text-accent transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter un lien
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
