"use client";

import { Character } from "@/lib/db";
import { cn, matchesSearch } from "@/lib/utils";
import { useRef, useState } from "react";
import { MentionText } from "../wiki/MentionText";

type Props = {
  value: string;
  onChange: (value: string) => void;
  characters: Character[];
  placeholder?: string;
  className?: string;
};

type MentionState = {
  start: number; // index du "@" dans le texte
  query: string;
};

const MAX_SUGGESTIONS = 6;

// Textarea avec autocomplétion "@Nom" : taper @ suivi de quelques
// lettres propose les personnages correspondants, et en choisir un
// insère @[Nom](id) dans le texte — le nom reste visible tel quel à
// l'édition, et l'id permet d'en faire un lien fiable à l'affichage
// (voir MentionText), increvable à un futur renommage.
export function MentionTextarea({
  value,
  onChange,
  characters,
  placeholder,
  className,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mention, setMention] = useState<MentionState | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  const suggestions = mention
    ? characters
        .filter((c) => matchesSearch(c.nom, mention.query))
        .slice(0, MAX_SUGGESTIONS)
    : [];

  function detectMention(text: string, caret: number) {
    const uptoCaret = text.slice(0, caret);
    const match = uptoCaret.match(/@([^\s@]{0,30})$/);
    if (!match) {
      setMention(null);
      return;
    }
    setMention({ start: caret - match[0].length, query: match[1] });
    setHighlighted(0);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    detectMention(e.target.value, e.target.selectionStart);
  }

  function handleSelectionChange() {
    const ta = textareaRef.current;
    if (!ta) return;
    detectMention(ta.value, ta.selectionStart);
  }

  function selectCharacter(c: Character) {
    if (!mention) return;
    const insertion = `@[${c.nom}](${c.id}) `;
    const newValue =
      value.slice(0, mention.start) +
      insertion +
      value.slice(mention.start + 1 + mention.query.length);
    onChange(newValue);
    setMention(null);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = mention.start + insertion.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!mention || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      selectCharacter(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setMention(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          className={cn("w-full", className)}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          placeholder={placeholder}
        />
        {mention && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-10 flex flex-col gap-0.5 rounded-md border border-border-mid bg-card p-1 shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectCharacter(c);
                }}
                className={`text-left text-[12px] px-2 py-1 rounded cursor-pointer ${
                  i === highlighted
                    ? "bg-active text-accent-light"
                    : "text-text-secondary hover:bg-elevated"
                }`}
              >
                {c.nom}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-text-muted">
        Tapez @ pour mentionner un personnage.
      </p>
      {value && (
        <div className="rounded-md border border-dashed border-border bg-elevated/50 px-3 py-2">
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">
            Aperçu
          </p>
          <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-line">
            <MentionText text={value} />
          </p>
        </div>
      )}
    </div>
  );
}
