// app/onboarding/page.tsx
"use client";

import { useSession } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeOnboarding } from "./action";

type SocialPlatform = "TIKTOK" | "YOUTUBE" | "INSTAGRAM" | "AUTRE";
type CreatorRoleInput = {
  type: "ARTISTE" | "EDITEUR";
  displayOnWiki: boolean;
  socialLinks: { platform: SocialPlatform; url: string }[];
};

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

const ROLE_LABELS: Record<
  "ARTISTE" | "EDITEUR",
  { label: string; sub: string }
> = {
  ARTISTE: {
    label: "Artiste (fan art)",
    sub: "Tu crées des fan arts des persos ou scènes de Flashback WL",
  },
  EDITEUR: {
    label: "Edit-maker",
    sub: "Tu montes des edits vidéo avec des clips du serveur",
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pseudo, setPseudo] = useState("");
  const [wantsCreator, setWantsCreator] = useState<boolean | null>(null);
  const [roles, setRoles] = useState<CreatorRoleInput[]>([]);

  const [rulesOpen, setRulesOpen] = useState(false);

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
              socialLinks: [
                ...r.socialLinks,
                { platform: "TIKTOK" as SocialPlatform, url: "" },
              ],
            }
          : r,
      ),
    );
  }

  function updateLink(
    type: "ARTISTE" | "EDITEUR",
    i: number,
    field: "platform" | "url",
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
        roles: wantsCreator ? roles : [],
      });
      await session?.reload();
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue, réessaie.");
      setLoading(false);
    }
  }

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

        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-1.5 mb-4 justify-center">
          {[1, 2, ...(wantsCreator ? [3] : [])].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all ${
                s === step
                  ? "w-6 bg-accent"
                  : s < step
                    ? "w-3 bg-accent/40"
                    : "w-3 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-[9px] font-medium text-text-muted uppercase tracking-widest mb-1">
            {step === 1
              ? "Bienvenue"
              : step === 2
                ? "Créateur de contenu"
                : "Ton profil créateur"}
          </p>

          {/* Étape 1 — pseudo */}
          {step === 1 && (
            <div className="space-y-5">
              <h1 className="text-text-primary font-display font-bold text-lg">
                Crée ton profil
              </h1>

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

              {error && <p className="text-[12px] text-red-400">{error}</p>}

              <button
                onClick={() => {
                  if (!pseudo.trim()) {
                    setError("Le pseudo est obligatoire.");
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="w-full rounded-md bg-accent py-2.5 text-[13px] font-medium text-white hover:bg-accent/90 transition-colors"
              >
                Suivant
              </button>
            </div>
          )}

          {/* Étape 2 — es-tu créateur ? */}
          {step === 2 && (
            <div className="space-y-5">
              <h1 className="text-text-primary font-display font-bold text-lg">
                Es-tu créateur de contenu ?
              </h1>
              <p className="text-[12px] text-text-muted leading-relaxed">
                Fan art, edits vidéo, montages... Si tu crées du contenu autour
                de Flashback WL, tu peux apparaître sur la page créateurs du
                wiki après validation.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setWantsCreator(true);
                    setStep(3);
                  }}
                  className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
                    wantsCreator === true
                      ? "border-accent/40 bg-accent/10 text-accent-light"
                      : "border-border bg-elevated text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 rounded-full border transition-colors ${wantsCreator === true ? "border-accent bg-accent" : "border-border"}`}
                  />
                  <div>
                    <p className="text-[13px] font-medium">
                      Oui, je crée du contenu
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Configurer mon profil créateur
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setWantsCreator(false);
                    setRoles([]);
                    handleSubmitDirect();
                  }}
                  className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
                    wantsCreator === false
                      ? "border-accent/40 bg-accent/10 text-accent-light"
                      : "border-border bg-elevated text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 rounded-full border transition-colors ${wantsCreator === false ? "border-accent bg-accent" : "border-border"}`}
                  />
                  <div>
                    <p className="text-[13px] font-medium">
                      Non, juste spectateur
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Terminer et accéder au wiki
                    </p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full rounded-md border border-border py-2.5 text-[13px] font-medium text-text-secondary hover:bg-elevated transition-colors"
              >
                Retour
              </button>
            </div>
          )}

          {/* Étape 3 — profil créateur */}
          {step === 3 && (
            <div className="space-y-5">
              <h1 className="text-text-primary font-display font-bold text-lg">
                Ton profil créateur
              </h1>
              <button
                onClick={() => setRulesOpen((o) => !o)}
                className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted hover:text-text-secondary transition-colors shrink-0"
              >
                Règles
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${rulesOpen ? "rotate-180" : ""}`}
                />
              </button>

              {rulesOpen && (
                <div className="mt-4 border-t border-border pt-4 space-y-1.5">
                  <p className="text-[11px] text-text-muted leading-relaxed mb-2">
                    Je me permets de mettre quelques règles en place pour que
                    cet endroit reste une place de bienveillance et de partage :
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
                      className="flex items-start gap-2 text-[11px] text-text-muted"
                    >
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/50" />
                      {rule}
                    </div>
                  ))}
                </div>
              )}

              {/* Sélection des rôles */}
              <div>
                <p className="text-[11px] font-medium text-text-secondary mb-2">
                  Quel type de contenu tu crées ?
                </p>
                <div className="space-y-1.5">
                  {(["ARTISTE", "EDITEUR"] as const).map((type) => {
                    const active = roles.some((r) => r.type === type);
                    return (
                      <RoleOption
                        key={type}
                        label={ROLE_LABELS[type].label}
                        sub={ROLE_LABELS[type].sub}
                        checked={active}
                        onClick={() => toggleRole(type)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Config par rôle */}
              {roles.map((role) => (
                <div
                  key={role.type}
                  className="rounded-lg border border-border bg-elevated p-4 space-y-3"
                >
                  <p className="text-[12px] font-semibold text-text-primary">
                    {role.type === "ARTISTE" ? "Fan art" : "Edits"}
                  </p>

                  <RoleOption
                    label="M'afficher sur la page du wiki"
                    sub="Ta demande sera examinée avant publication"
                    checked={role.displayOnWiki}
                    onClick={() => toggleDisplay(role.type)}
                  />

                  {/* Liens du rôle */}
                  <div>
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1.5">
                      Tes liens (
                      {role.type === "ARTISTE"
                        ? "où trouver ton fan art"
                        : "où trouver tes edits"}
                      )
                    </p>
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
                            className="rounded-md border border-border bg-card px-2 text-[12px] text-text-primary outline-none focus:border-accent"
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
                              updateLink(role.type, i, "url", e.target.value)
                            }
                            placeholder="https://..."
                            className="flex-1 rounded-md border border-border bg-card px-3 text-[12px] text-text-primary placeholder-text-muted outline-none focus:border-accent"
                          />
                          <button
                            onClick={() => removeLink(role.type, i)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-text-muted hover:text-red-400 transition-colors"
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
                      onClick={() => addLink(role.type)}
                      className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-accent-light hover:text-accent transition-colors"
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
                </div>
              ))}

              {error && <p className="text-[12px] text-red-400">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
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

  async function handleSubmitDirect() {
    setLoading(true);
    setError(null);
    try {
      await completeOnboarding({ pseudo: pseudo.trim(), roles: [] });
      await session?.reload();
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue, réessaie.");
      setLoading(false);
    }
  }
}

function RoleOption({
  label,
  sub,
  checked,
  onClick,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors ${
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
      <div>
        <p className="text-[13px] font-medium">{label}</p>
        {sub && <p className="text-[11px] text-text-muted mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}
