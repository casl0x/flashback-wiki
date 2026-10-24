"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function PollAdmin() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [endsAt, setEndsAt] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [allowProposals, setAllowProposals] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  function addOption() {
    if (options.length < 6) setOptions([...options, ""]);
  }

  function updateOption(i: number, val: string) {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || (!allowProposals && cleanOptions.length < 2)) {
      setMessage({
        text: "Question et au moins 2 options requises (sauf si les propositions sont autorisées).",
        ok: false,
      });
      return;
    }
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question.trim(),
        options: cleanOptions,
        endsAt: endsAt || null,
        isPublic,
        allowProposals,
      }),
    });
    if (res.ok) {
      setMessage({ text: "Sondage créé et activé !", ok: true });
      setQuestion("");
      setOptions(["", ""]);
      setEndsAt("");
      setIsPublic(false);
      setAllowProposals(false);
    } else {
      const data = await res.json();
      setMessage({ text: data.error ?? "Erreur inconnue", ok: false });
    }
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13px] font-semibold text-text-primary tracking-wide">
          Créer un sondage
        </h2>
      </div>

      <div className="flex flex-col gap-3 pb-5 border-b border-border">
        {/* Question */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-text-muted">
            Question
          </label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex : Quel personnage a eu le meilleur arc ce mois-ci ?"
            className="h-8 text-[13px]"
          />
        </div>

        {/* Options */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-text-muted">
            Options{allowProposals ? " (facultatif)" : ""}
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="h-8 text-[13px]"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(i)}
                    className="px-2 text-text-muted hover:text-text-secondary border border-border rounded-md transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button
              onClick={addOption}
              className="mt-1 w-full text-[12px] text-text-muted border border-dashed border-border rounded-md py-1.5 hover:border-border-mid hover:text-text-secondary transition-colors"
            >
              + Ajouter une option
            </button>
          )}
        </div>

        {/* Visibilité */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-text-muted">
            Qui peut répondre ?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: false, label: "Privé", hint: "Membres connectés" },
              { value: true, label: "Public", hint: "Tout le monde" },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setIsPublic(opt.value)}
                className={`rounded-md border px-3 py-2 text-left transition-colors ${
                  isPublic === opt.value
                    ? "border-accent-light text-text-primary bg-muted"
                    : "border-border text-text-muted hover:border-border-mid"
                }`}
              >
                <span className="block text-[13px] font-medium">
                  {opt.label}
                </span>
                <span className="block text-[11px]">{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Propositions */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allowProposals}
            onChange={(e) => setAllowProposals(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-[12px] text-text-secondary">
            Autoriser les votants à proposer leurs propres options
            <span className="block text-[11px] text-text-muted">
              Les options ci-dessus deviennent facultatives.
            </span>
          </span>
        </label>

        {/* Date de fin */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-text-muted">
            Date de fin (optionnel)
          </label>
          <Input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="h-8 text-[13px]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        {message ? (
          <p
            className={`text-[12px] ${message.ok ? "text-green-400" : "text-red-400"}`}
          >
            {message.text}
          </p>
        ) : (
          <span />
        )}
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={loading || !question}
        >
          {loading ? "…" : "Publier le sondage"}
        </Button>
      </div>
    </div>
  );
}
