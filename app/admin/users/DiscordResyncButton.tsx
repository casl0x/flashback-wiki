"use client";

import { Button, Notice } from "@/app/_composents/admin/ui";
import { resyncDiscordBatch, resyncOrgMembersDiscord } from "@/lib/admin/actions/discord";
import { useState } from "react";

/** Envoie au bot Discord l'état de tous les membres (rôle + badges) pour trier les rôles. */
export default function DiscordResyncButton() {
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function run() {
    setRunning(true);
    setMsg(null);
    let cursor: string | null = null;
    let total = 0;
    try {
      for (;;) {
        const r = await resyncDiscordBatch(cursor);
        if (!r.ok) {
          setMsg({ tone: "error", text: `${r.error} (${total} membre(s) déjà traités)` });
          return;
        }
        total += r.data.processed;
        setMsg({ tone: "ok", text: `${total} membre(s) envoyé(s) au bot…` });
        if (r.data.done || !r.data.next) break;
        cursor = r.data.next;
      }
      setMsg({ tone: "ok", text: `${total} membre(s) envoyé(s). Envoi des membres de l'organisation…` });
      const org = await resyncOrgMembersDiscord();
      if (!org.ok) {
        setMsg({ tone: "error", text: `${org.error} (${total} membre(s) déjà traités)` });
        return;
      }
      setMsg({
        tone: "ok",
        text: `Terminé : ${total} membre(s) et ${org.data.processed} membre(s) de l'organisation envoyé(s). Le détail est dans le journal de /admin/bot.`,
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled={running} onClick={run}>
        {running ? "Envoi en cours…" : "Resynchroniser les rôles Discord"}
      </Button>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </div>
  );
}
