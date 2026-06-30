// app/onboarding/page.tsx
"use client";

import { useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeOnboarding } from "./action";

type SocialPlatform = "TIKTOK" | "YOUTUBE" | "INSTAGRAM" | "AUTRE";

type CreatorRoleInput = { type: "ARTISTE" | "EDITEUR"; displayOnWiki: boolean };
type SocialLinkInput = { platform: SocialPlatform; url: string };

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "TIKTOK",
  "YOUTUBE",
  "INSTAGRAM",
  "AUTRE",
];

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  AUTRE: "Autre",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pseudo, setPseudo] = useState("");
  const [roles, setRoles] = useState<CreatorRoleInput[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinkInput[]>([]);

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

  function addSocialLink() {
    setSocialLinks((prev) => [...prev, { platform: "AUTRE", url: "" }]);
  }

  function updateSocialLink(
    index: number,
    field: keyof SocialLinkInput,
    value: string,
  ) {
    setSocialLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    );
  }

  function removeSocialLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!pseudo.trim()) {
      setError("Le pseudo est obligatoire.");
      setStep(1);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await completeOnboarding({
        pseudo: pseudo.trim(),
        roles,
        socialLinks: socialLinks.filter((l) => l.url.trim() !== ""),
      });
      await session?.reload();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue, réessaie.");
      setLoading(false);
    }
  }

  const hasCreatorRole = roles.length > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm shrink-0">
            ⚡
          </div>
          <span className="font-display font-bold text-[17px] tracking-widest text-text-primary">
            FLASH<span className="text-accent-light">BACK</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-[9px] font-medium text-text-muted uppercase tracking-widest mb-1">
            Bienvenue
          </p>
          <h1 className="text-text-primary font-display font-bold text-lg mb-5">
            Crée ton profil
          </h1>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1.5">
                  Choisis ton pseudo
                </label>
                <input
                  type="text"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="Ton pseudo"
                  className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-[13px] text-text-primary placeholder-text-muted outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <p className="text-[11px] font-medium text-text-secondary mb-2">
                  Es-tu créateur de contenu ? (optionnel)
                </p>
                <div className="space-y-1.5">
                  <RoleOption
                    label="Artiste (fan art)"
                    checked={roles.some((r) => r.type === "ARTISTE")}
                    onClick={() => toggleRole("ARTISTE")}
                  />
                  <RoleOption
                    label="Edit-maker"
                    checked={roles.some((r) => r.type === "EDITEUR")}
                    onClick={() => toggleRole("EDITEUR")}
                  />
                </div>
              </div>

              {error && <p className="text-[12px] text-red-400">{error}</p>}

              <button
                onClick={() => {
                  if (!pseudo.trim()) {
                    setError("Le pseudo est obligatoire.");
                    return;
                  }
                  setError(null);
                  if (hasCreatorRole) {
                    setStep(2);
                  } else {
                    handleSubmit();
                  }
                }}
                disabled={loading}
                className="w-full rounded-md bg-accent py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {hasCreatorRole ? "Suivant" : loading ? "..." : "Terminer"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                {roles.map((role) => (
                  <RoleOption
                    key={role.type}
                    label={`M'afficher sur la page ${role.type === "ARTISTE" ? "Artistes" : "Edits"}`}
                    checked={role.displayOnWiki}
                    onClick={() => toggleDisplay(role.type)}
                  />
                ))}
              </div>

              <div>
                <p className="text-[11px] font-medium text-text-secondary mb-2">
                  Tes liens
                </p>
                <div className="space-y-2">
                  {socialLinks.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <select
                        value={link.platform}
                        onChange={(e) =>
                          updateSocialLink(i, "platform", e.target.value)
                        }
                        className="rounded-md border border-border bg-elevated px-2 text-[12px] text-text-primary outline-none focus:border-accent"
                      >
                        {SOCIAL_PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {PLATFORM_LABELS[p]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) =>
                          updateSocialLink(i, "url", e.target.value)
                        }
                        placeholder="https://..."
                        className="flex-1 rounded-md border border-border bg-elevated px-3 text-[12px] text-text-primary placeholder-text-muted outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => removeSocialLink(i)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-text-muted hover:text-red-400 hover:bg-elevated transition-colors"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addSocialLink}
                  className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-accent-light hover:text-accent transition-colors"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Ajouter un lien
                </button>
              </div>

              {error && <p className="text-[12px] text-red-400">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-md border border-border py-2.5 text-[13px] font-medium text-text-secondary hover:bg-elevated transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 rounded-md bg-accent py-2.5 text-[13px] font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "..." : "Terminer"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleOption({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
        checked
          ? "border-accent/40 bg-accent/10 text-accent-light"
          : "border-border bg-elevated text-text-secondary hover:text-text-primary"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-lg border transition-colors ${
          checked ? "border-accent bg-accent" : "border-border"
        }`}
      >
        {checked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}
