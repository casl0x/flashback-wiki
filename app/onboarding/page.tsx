// app/onboarding/page.tsx
"use client";

import Image from "next/image";
import { useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeOnboarding } from "./action";

export default function OnboardingPage() {
  const router = useRouter();
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState("");

  async function handleSubmit() {
    if (!pseudo.trim()) {
      setError("Le pseudo est obligatoire.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await completeOnboarding({ pseudo: pseudo.trim() });
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      let attempts = 0;
      while (attempts < 5) {
        await session?.reload();
        const meta = session?.user?.publicMetadata as
          | { onboardingComplete?: boolean }
          | undefined;
        if (meta?.onboardingComplete) break;
        await new Promise((r) => setTimeout(r, 500));
        attempts++;
      }

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
          <Image
            src="/brand/logo-icon.svg"
            alt=""
            aria-hidden
            width={32}
            height={32}
            className="rounded-lg shrink-0"
          />
          <span className="font-display font-bold text-[17px] tracking-widest text-text-primary">
            FLASH<span className="text-accent-light">BACK</span>
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-[9px] font-medium text-text-muted uppercase tracking-widest mb-1">
            Bienvenue
          </p>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
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
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-accent py-2.5 text-[13px] font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "Terminer"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
