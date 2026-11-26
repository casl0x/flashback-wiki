"use client";

import { Button, Empty, Notice, Panel, Tag } from "@/app/_composents/admin/ui";
import { useCallback, useEffect, useState } from "react";

type AdminPoll = {
  id: string;
  question: string;
  active: boolean;
  isPublic: boolean;
  allowProposals: boolean;
  endsAt: string | null;
  createdAt: string;
  totalVotes: number;
};

export function PollList({ refreshKey }: { refreshKey: number }) {
  const [polls, setPolls] = useState<AdminPoll[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/polls?all=1", { cache: "no-store" });
    if (!res.ok) {
      setError("Impossible de charger les sondages.");
      return;
    }
    setPolls(await res.json());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/polls?all=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: AdminPoll[]) => {
        if (!cancelled) setPolls(data);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les sondages.");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function toggle(poll: AdminPoll) {
    setBusyId(poll.id);
    setError(null);
    const res = await fetch(`/api/polls/${poll.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !poll.active }),
    });
    if (!res.ok) setError("Action impossible.");
    await load();
    setBusyId(null);
  }

  async function remove(poll: AdminPoll) {
    if (!confirm(`Supprimer « ${poll.question} » et ses votes ?`)) return;
    setBusyId(poll.id);
    setError(null);
    const res = await fetch(`/api/polls/${poll.id}`, { method: "DELETE" });
    if (!res.ok) setError("Suppression impossible.");
    await load();
    setBusyId(null);
  }

  return (
    <Panel legend="Sondages existants">
      <div className="flex flex-col gap-3">
        {error && <Notice tone="error">{error}</Notice>}
        {polls === null ? (
          <p className="m-0 text-[13px] text-[#9AA0AA]">Chargement…</p>
        ) : polls.length === 0 ? (
          <Empty>Aucun sondage pour l’instant.</Empty>
        ) : (
          polls.map((poll) => (
            <div
              key={poll.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#23262D] p-3"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-[14px] font-semibold text-[#ECECEE]">
                  {poll.question}
                </span>
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#9AA0AA]">
                  <Tag
                    color={poll.active ? "#7FF0B0" : "#A3A8B3"}
                  >
                    {poll.active ? "Affiché sur l’accueil" : "Masqué"}
                  </Tag>
                  <span>{poll.isPublic ? "Public" : "Privé"}</span>
                  {poll.allowProposals && <span>Propositions ouvertes</span>}
                  <span>
                    {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
                  </span>
                  <span>
                    {new Date(poll.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={busyId === poll.id}
                  onClick={() => toggle(poll)}
                >
                  {poll.active ? "Masquer" : "Afficher"}
                </Button>
                <Button
                  variant="danger"
                  disabled={busyId === poll.id}
                  onClick={() => remove(poll)}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
