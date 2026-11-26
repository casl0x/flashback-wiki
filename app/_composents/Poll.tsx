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
  isPublic: boolean;
  allowProposals: boolean;
  hasProposed: boolean;
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
  const [proposal, setProposal] = useState("");

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
    if (!canParticipate) return;
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

  async function handlePropose() {
    const label = proposal.trim();
    if (!label || !canParticipate) return;
    setVoting(true);
    setError(null);
    const res = await fetch(`/api/polls/${pollId}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else {
      setProposal("");
      await fetchPoll();
    }
    setVoting(false);
  }

  if (loading || !poll) return null;


  const canParticipate = !!poll && (poll.isPublic || !!isSignedIn);
  const hasVoted = !!poll.userVotedOptionId;
  const isExpired = poll.endsAt ? new Date() > new Date(poll.endsAt) : false;
  const showResults = hasVoted || !poll.active || isExpired;

  return (
    <section
      aria-labelledby="poll-h"
      className="flex flex-col gap-4 p-4 lg:p-5"
    >
      <h2
        id="poll-h"
        className="text-sans text-3xl uppercase tracking-wide md:text-4xl"
      >
        Sondage
      </h2>
      <div className="flex flex-col gap-4 rounded-md bg-muted p-4 lg:p-6">
      {/* Header */}
      {(poll.isPublic || poll.endsAt) && (
      <div className="flex items-center gap-2">
        {poll.isPublic && (
          <span className="text-[10px] uppercase tracking-widest text-text-muted">
            Public
          </span>
        )}
        {poll.endsAt && !isExpired && (
          <span className="text-[11px] text-text-muted">
            Jusqu'au {new Date(poll.endsAt).toLocaleDateString("fr-FR")}
          </span>
        )}
        {isExpired && (
          <span className="text-[11px] text-text-faint italic">Terminé</span>
        )}
      </div>
      )}

      {/* Question */}
      <p className="text-base font-medium leading-relaxed text-text-primary">
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
                  <span className="text-[12px] font-semibold text-text-muted min-w-9 text-right">
                    {option.percent}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-card overflow-hidden">
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
              disabled={voting || !canParticipate}
              className="w-full text-left cursor-pointer px-4 py-2.5 rounded-lg border border-border bg-card text-[13px] font-medium text-text-secondary hover:border-border-mid hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Proposition */}
      {poll.allowProposals && !poll.hasProposed && !poll.userVotedOptionId && !(!poll.active || isExpired) && canParticipate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePropose();
          }}
          className="flex gap-2"
        >
          <input
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            maxLength={80}
            placeholder="Proposer une option…"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-card text-[13px] text-text-primary placeholder:text-text-faint"
          />
          <button
            type="submit"
            disabled={voting || !proposal.trim()}
            className="px-3 py-2 rounded-lg border border-border bg-card text-[13px] font-medium text-text-secondary hover:border-border-mid disabled:opacity-50"
          >
            Ajouter
          </button>
        </form>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-text-faint">
          {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
        </span>

        {!canParticipate && !showResults && (
          <SignInButton mode="modal">
            <button className="text-[11px] font-medium text-accent-light hover:underline">
              Se connecter pour participer →
            </button>
          </SignInButton>
        )}

        {error && (
          <span className="text-[11px] text-red-400">{error}</span>
        )}
      </div>
      </div>
    </section>
  );
}
