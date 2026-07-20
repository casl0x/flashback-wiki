// app/profil/page.tsx
"use client";

import { BadgePill } from "@/components/user/badges";
import { useUser } from "@clerk/nextjs";
import {
  Check,
  Film,
  Link2,
  Pencil,
  PencilLine,
  Plus,
  Sparkles,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { updateCreatorProfile } from "../onboarding/action";

type SocialLink = { platform: string; url: string };
type CreatorRole = {
  type: "ARTISTE" | "EDITEUR";
  displayOnWiki: boolean;
  status?: string;
  socialLinks: SocialLink[];
};

type MeData = {
  pseudo: string;
  avatarUrl: string | null;
  points: number;
  badges: string[];
  stats: { pending: number; accepted: number; rejected: number };
  creatorRoles: CreatorRole[];
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

const STATUS_STYLE: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  approved: "border-green-500/30 bg-green-500/10 text-green-400",
  rejected: "border-red-500/30 bg-red-500/10 text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente de validation",
  approved: "Validé",
  rejected: "Refusé",
};

export default function ProfilePage() {
  const { isLoaded, isSignedIn } = useUser();
  const [data, setData] = useState<MeData | null>(null);
  const [fetched, setFetched] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<CreatorRole[]>([]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setRoles(d.creatorRoles ?? []);
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
        : [...prev, { type, displayOnWiki: false, socialLinks: [] }],
    );
  }

  function toggleDisplay(type: "ARTISTE" | "EDITEUR") {
    setRoles((prev) =>
      prev.map((r) =>
        r.type === type ? { ...r, displayOnWiki: !r.displayOnWiki } : r,
      ),
    );
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
          ...r,
          socialLinks: r.socialLinks.map((l) => ({
            platform: l.platform as never,
            url: l.url,
          })),
        })),
      });
      setData((prev) => (prev ? { ...prev, creatorRoles: roles } : prev));
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 p-4 lg:p-5">
      {/* Header profil */}
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
          <>
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

            <div className="border-t border-border pt-5">
              <div className="flex  gap-2 mb-2">
                <PencilLine className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Total de propositions de modifications : {totalSuggestions}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Section créateur */}
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

          <div className="border-t border-border pt-5 space-y-3">
            {/* Sélection des rôles */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Rôles
              </p>
              <div className="flex flex-wrap gap-2">
                {(["ARTISTE", "EDITEUR"] as const).map((type) => {
                  const active = !!roles.find((r) => r.type === type);
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
            </div>

            {/* Sections par rôle */}
            {roles.map((role) => (
              <div
                key={role.type}
                className="rounded-lg border border-border bg-muted p-4 space-y-3"
              >
                {/* Titre + statut + toggle wiki */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {role.type === "ARTISTE" ? (
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    ) : (
                      <Film className="h-3.5 w-3.5 text-blue-400" />
                    )}
                    <span className="text-[13px] font-medium text-text-primary">
                      {role.type === "ARTISTE" ? "Fan art" : "Edits"}
                    </span>
                    {role.status && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[role.status] ?? ""}`}
                      >
                        {STATUS_LABEL[role.status] ?? role.status}
                      </span>
                    )}
                  </div>
                  <label
                    className={`flex items-center gap-1.5 text-xs ${editing ? "text-text-primary cursor-pointer" : "text-muted-foreground"}`}
                  >
                    <input
                      type="checkbox"
                      checked={role.displayOnWiki}
                      disabled={!editing}
                      onChange={() => toggleDisplay(role.type)}
                      className="accent-accent"
                    />
                    Afficher sur le wiki
                  </label>
                </div>

                {/* Liens du rôle */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
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
                            className="text-[11px] text-muted-foreground hover:text-text-primary border border-border bg-elevated rounded-md px-2 py-0.5 transition-colors"
                          >
                            {PLATFORM_LABELS[l.platform] ?? l.platform}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Aucun lien renseigné.
                      </p>
                    )
                  ) : (
                    <div className="space-y-1.5">
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
                            className="rounded-md border border-border bg-card px-2 text-xs text-text-primary outline-none focus:border-accent"
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
                              updateLink(role.type, i, "url", e.target.value)
                            }
                            placeholder="https://..."
                            className="flex-1 rounded-md border border-border bg-card px-3 text-xs text-text-primary placeholder-muted-foreground outline-none focus:border-accent"
                          />
                          <button
                            onClick={() => removeLink(role.type, i)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addLink(role.type)}
                        className="flex items-center gap-1.5 text-xs font-medium text-accent-light hover:text-accent transition-colors"
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
              <p className="text-sm text-muted-foreground">
                Aucun rôle créateur défini.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
