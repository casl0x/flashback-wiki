"use client";

import { InlineNotice } from "@/app/_composents/notice/InlineNotice";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type Status = {
  pending: boolean;
  rejected: {
    rejectReason: string | null;
    moderatorMessage: string | null;
  } | null;
};

/** Bandeaux propres à l'utilisateur connecté (ses propositions sur ce perso). */
export function CharacterUserNotices({ characterId }: { characterId: string }) {
  const { isLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch(`/api/characters/${characterId}/suggestion-status`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {});
  }, [isLoaded, isSignedIn, characterId]);

  if (!status) return null;

  return (
    <>
      {status.pending && (
        <InlineNotice
          tone="info"
          action={{
            label: "Voir la proposition",
            href: "/profil#propositions",
          }}
        >
          Une modification de cette fiche est en attente de validation.
        </InlineNotice>
      )}
      {status.rejected && (
        <InlineNotice
          tone="error"
          action={{
            label: "Voir mes propositions",
            href: "/profil#propositions",
          }}
        >
          Ta proposition a été refusée
          {status.rejected.rejectReason
            ? ` : ${status.rejected.rejectReason}.`
            : "."}
          {status.rejected.moderatorMessage
            ? ` ${status.rejected.moderatorMessage}`
            : ""}
        </InlineNotice>
      )}
    </>
  );
}
