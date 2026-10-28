"use client";

import { useMemo, useRef, useState } from "react";
import { Character } from "@/lib/db";

type Props = {
  value: string;
  onChange: (value: string) => void;
  characters: Character[];
  placeholder?: string;
  className?: string;
};

type Trigger = { start: number; query: string };

// Cherche un « @mot » juste avant le curseur (le @ doit être en début de
// texte ou précédé d'un espace / retour à la ligne).
function findTrigger(text: string, caret: number): Trigger | null {
  const before = text.slice(0, caret);
  const m = /(?:^|\s)@([^\s@[\]()]*)$/.exec(before);
  if (!m) return null;
  return { start: caret - m[1].length - 1, query: m[1] };
}

// Textarea qui propose, dès qu'on tape « @ », la liste des personnages et
// insère la mention au format @[Nom](id) à la sélection.
export function MentionTextarea({
  value,
  onChange,
  characters,
  placeholder,
  className,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [active, setActive] = useState(0);

  const suggestions = useMemo(() => {
    if (!trigger) return [];
    const q = trigger.query.toLowerCase();
    return characters
      .filter((c) => {
        const pseudo = c.player?.pseudo ?? "";
        return (
          !q ||
          c.nom.toLowerCase().includes(q) ||
          pseudo.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [trigger, characters]);

  function refresh(el: HTMLTextAreaElement) {
    setTrigger(findTrigger(el.value, el.selectionStart));
    setActive(0);
  }

  function pick(c: Character) {
    const el = ref.current;
    if (!trigger || !el) return;
    const caret = el.selectionStart;
    const insert = `@[${c.nom}](${c.id}) `;
    const next = value.slice(0, trigger.start) + insert + value.slice(caret);
    onChange(next);
    setTrigger(null);
    const pos = trigger.start + insert.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.currentTarget.value);
          refresh(e.currentTarget);
        }}
        onClick={(e) => refresh(e.currentTarget)}
        onKeyUp={(e) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
            refresh(e.currentTarget);
          }
        }}
        onBlur={() => setTrigger(null)}
        onKeyDown={(e) => {
          if (!trigger || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            pick(suggestions[active]);
          } else if (e.key === "Escape") {
            setTrigger(null);
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      {trigger && suggestions.length > 0 && (
        <ul className="absolute left-0 top-full z-20 mt-1 max-h-60 w-72 overflow-auto rounded-lg border border-[#3A3E47] bg-[#14161B] py-1 shadow-lg">
          {suggestions.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                // mouseDown pour agir avant le blur du textarea
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(c);
                }}
                className={`flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-[13px] text-[#ECECEE] ${
                  i === active ? "bg-[#2A2D35]" : ""
                }`}
              >
                <span>{c.nom}</span>
                {c.player?.pseudo && (
                  <span className="text-[11px] text-[#9AA0AA]">
                    {c.player.pseudo}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
