"use client";

import { useMemo, useRef, useState } from "react";
import { Character } from "@/lib/db";

// Le minimum utile pour proposer une mention : un Character complet convient.
export type MentionCharacter = Pick<Character, "id" | "nom"> & {
  player?: { pseudo: string } | null;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  characters: MentionCharacter[];
  placeholder?: string;
  className?: string;
  /** Ajoute « Sous-titre » et « Liste » (texte long : page Lore). */
  blockTools?: boolean;
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
  blockTools = false,
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

  function pick(c: MentionCharacter) {
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

  // Entoure la sélection (ou insère des marqueurs vides) avec la mise en forme
  function wrap(marker: string) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const selected = value.slice(a, b);
    const next =
      value.slice(0, a) + marker + selected + marker + value.slice(b);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + marker.length, b + marker.length);
    });
  }

  // Préfixe la ligne du curseur (sous-titre, liste) ; un second clic le retire.
  function prefixLine(prefix: string) {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart;
    const start = value.lastIndexOf("\n", caret - 1) + 1;
    const hasPrefix = value.startsWith(prefix, start);
    const next = hasPrefix
      ? value.slice(0, start) + value.slice(start + prefix.length)
      : value.slice(0, start) + prefix + value.slice(start);
    onChange(next);
    const pos = caret + (hasPrefix ? -prefix.length : prefix.length);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  // Insère [texte](https://) autour de la sélection et sélectionne l'adresse à coller.
  function insertLink() {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const label = value.slice(a, b) || "texte";
    const insert = `[${label}](https://)`;
    onChange(value.slice(0, a) + insert + value.slice(b));
    const urlStart = a + label.length + 3;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(urlStart, urlStart + "https://".length);
    });
  }

  const tools: { label: React.ReactNode; title: string; marker: string }[] = [
    { label: <b>G</b>, title: "Gras (Ctrl+B)", marker: "**" },
    { label: <i>I</i>, title: "Italique (Ctrl+I)", marker: "*" },
    { label: <u>S</u>, title: "Souligné (Ctrl+U)", marker: "__" },
    { label: <s>B</s>, title: "Barré", marker: "~~" },
  ];

  return (
    <div className="relative">
      <div className="mb-1.5 flex flex-wrap items-center gap-1">
        {tools.map((t) => (
          <button
            key={t.marker}
            type="button"
            title={t.title}
            aria-label={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => wrap(t.marker)}
            className="h-7 min-w-7 cursor-pointer rounded-md border border-[#3A3E47] bg-[#15171B] px-2 text-[13px] text-[#ECECEE] hover:bg-[#23262D]"
          >
            {t.label}
          </button>
        ))}
        {blockTools && (
          <>
            <button
              type="button"
              title="Sous-titre (ligne commençant par ##)"
              aria-label="Sous-titre"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => prefixLine("## ")}
              className="h-7 min-w-7 cursor-pointer rounded-md border border-[#3A3E47] bg-[#15171B] px-2 text-[13px] font-bold text-[#ECECEE] hover:bg-[#23262D]"
            >
              H
            </button>
            <button
              type="button"
              title="Liste à puces (ligne commençant par -)"
              aria-label="Liste à puces"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => prefixLine("- ")}
              className="h-7 min-w-7 cursor-pointer rounded-md border border-[#3A3E47] bg-[#15171B] px-2 text-[13px] text-[#ECECEE] hover:bg-[#23262D]"
            >
              •
            </button>
            <button
              type="button"
              title="Citation (ligne commençant par >)"
              aria-label="Citation"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => prefixLine("> ")}
              className="h-7 min-w-7 cursor-pointer rounded-md border border-[#3A3E47] bg-[#15171B] px-2 text-[13px] text-[#ECECEE] hover:bg-[#23262D]"
            >
              ”
            </button>
            <button
              type="button"
              title="Lien : [texte](https://…)"
              aria-label="Lien"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertLink}
              className="h-7 min-w-7 cursor-pointer rounded-md border border-[#3A3E47] bg-[#15171B] px-2 text-[13px] text-[#ECECEE] hover:bg-[#23262D]"
            >
              🔗
            </button>
          </>
        )}
        <span className="ml-1 text-[11px] text-[#7C8190]">
          **gras** · *italique* · __souligné__ · ~~barré~~
          {blockTools && " · ## titre · - liste · 1. liste · > citation · [texte](https://…) · --- ligne"}
        </span>
      </div>
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
          if (e.ctrlKey || e.metaKey) {
            const k = e.key.toLowerCase();
            const marker = k === "b" ? "**" : k === "i" ? "*" : k === "u" ? "__" : null;
            if (marker) {
              e.preventDefault();
              wrap(marker);
              return;
            }
          }
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
