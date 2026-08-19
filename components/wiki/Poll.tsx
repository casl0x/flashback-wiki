"use client";

import { useEffect, useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";

type PollOption = {
  id: string;
  label: string;
  votes: number;
  percent: number;
};

type PollData = {
  id: string;
  question: string;
  active: boolean;
  endsAt: string | null;
  totalVotes: number;
  userVotedOptionId: string | null;
  options: PollOption[];
};

export function Poll() {
  const { isSignedIn } = useUser();
  const [pollId, setPollId] = useState<string | null>(null);
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/polls")
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) setPollId(data.id);
        else setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!pollId) return;
    fetchPoll();
  }, [pollId, isSignedIn]);

  async function fetchPoll() {
    setLoading(true);
    const res = await fetch(`/api/polls/${pollId}`);
    const data = await res.json();
    setPoll(data);
    setLoading(false);
  }

  async function handleVote(optionId: string) {
    if (!isSignedIn) return;
    setVoting(true);
    setError(null);
    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else await fetchPoll();
    setVoting(false);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 lg:p-8 animate-pulse">
        <div className="h-4 w-20 rounded bg-muted mb-4" />
        <div className="h-5 w-3/4 rounded bg-muted mb-6" />
        <div className="space-y-2">
          <div className="h-10 rounded-lg bg-muted" />
          <div className="h-10 rounded-lg bg-muted" />
          <div className="h-10 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const hasVoted = !!poll.userVotedOptionId;
  const isExpired = poll.endsAt ? new Date() > new Date(poll.endsAt) : false;
  const showResults = hasVoted || !poll.active || isExpired;

  return (
    <div className="rounded-xl border border-border bg-card p-5 lg:p-8 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border border-border bg-muted text-text-muted">
          Sondage
        </span>
        {poll.endsAt && !isExpired && (
          <span className="text-[11px] text-text-muted">
            Jusqu'au {new Date(poll.endsAt).toLocaleDateString("fr-FR")}
          </span>
        )}
        {isExpired && (
          <span className="text-[11px] text-text-faint italic">Terminé</span>
        )}
      </div>

      {/* Question */}
      <p className="text-sm font-medium leading-relaxed text-text-primary">
        {poll.question}
      </p>

      {/* Options */}
      <div className="space-y-2.5">
        {poll.options.map((option) => {
          const isSelected = poll.userVotedOptionId === option.id;

          if (showResults) {
            return (
              <div key={option.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[13px] font-medium ${
                      isSelected ? "text-accent-light" : "text-text-secondary"
                    }`}
                  >
                    {isSelected && "✓ "}
                    {option.label}
                  </span>
                  <span className="text-[12px] font-semibold text-text-muted min-w-[36px] text-right">
                    {option.percent}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSelected ? "bg-accent-light" : "bg-border-mid"
                    }`}
                    style={{ width: `${option.percent}%` }}
                  />
                </div>
              </div>
            );
          }

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={voting || !isSignedIn}
              className="w-full text-left cursor-pointer px-4 py-2.5 rounded-lg border border-border bg-muted text-[13px] font-medium text-text-secondary hover:border-border-mid hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-text-faint">
          {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
        </span>

        {!isSignedIn && !showResults && (
          <SignInButton mode="modal">
            <button className="text-[11px] font-medium text-accent-light hover:underline">
              Se connecter pour voter →
            </button>
          </SignInButton>
        )}

        {error && (
          <span className="text-[11px] text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
}
