"use client";

import { Button, Notice } from "@/app/_composents/admin/ui";
import { recomputeContributionBadges } from "@/lib/admin/actions/points";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Rattrapage : applique les badges aux membres déjà crédités à la main. Relançable sans danger. */
export default function RecomputeBadgesButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await recomputeContributionBadges();
            if (!r.ok) return setMsg({ tone: "error", text: r.error });
            setMsg({
              tone: "ok",
              text: `${r.data.members} membre(s) vérifié(s), ${r.data.badges} badge(s) attribué(s).`,
            });
            router.refresh();
          })
        }
      >
        Recalculer les badges de contribution
      </Button>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </div>
  );
}
