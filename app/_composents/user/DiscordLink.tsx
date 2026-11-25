"use client";

import { useToast } from "@/app/_composents/toast/ToastProvider";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

/**
 * Permet à un membre connecté autrement (Google, e-mail…) de relier son compte Discord.
 * Après l'autorisation chez Discord, Clerk le ramène sur /profil?discord=linked, où la
 * synchronisation des rôles est lancée.
 */
export function DiscordLink({ linked }: { linked: boolean }) {
  const { user } = useUser();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (linked) {
    return (
      <span className="text-[13px] text-[#6EE7A0]">Discord relié ✓</span>
    );
  }

  async function link() {
    if (!user) return;
    setBusy(true);
    try {
      const account = await user.createExternalAccount({
        strategy: "oauth_discord",
        redirectUrl: `${window.location.origin}/profil?discord=linked`,
        additionalScopes: ["guilds.join"],
      });
      const url = account.verification?.externalVerificationRedirectURL;
      if (!url) throw new Error("Redirection Discord indisponible");
      window.location.href = url.toString();
    } catch (err) {
      setBusy(false);
      toast({
        tone: "error",
        title: "Liaison Discord impossible",
        text: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <button
      type="button"
      onClick={link}
      disabled={busy || !user}
      className="w-fit rounded-md border border-[#3A3E47] px-2.5 py-1 text-[13px] font-semibold text-[#ECECEE] hover:border-[#6E7380] disabled:opacity-50"
    >
      {busy ? "Redirection…" : "Relier mon compte Discord"}
    </button>
  );
}
