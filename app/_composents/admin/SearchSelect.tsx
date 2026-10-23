"use client";

import { cn, matchesSearch } from "@/lib/utils";
import { useId, useMemo, useRef, useState } from "react";
import { inputCls } from "./ui";

export type Option = { value: string; label: string; hint?: string | null };

type Props = {
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  label: string; // libellé accessible
  allowClear?: boolean;
  className?: string;
  /** Proposé en bas de liste quand rien ne correspond exactement (ex. créer un joueur). */
  onCreate?: (text: string) => void;
  createLabel?: (text: string) => string;
};

const MAX = 40;

/** Liste déroulante avec recherche, pour les longues listes (persos, joueurs, groupes). */
export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Rechercher…",
  label,
  allowClear = true,
  className,
  onCreate,
  createLabel = (t) => `Créer « ${t} »`,
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(
    () => options.filter((o) => !query || matchesSearch(o.label, query) || matchesSearch(o.hint ?? "", query)).slice(0, MAX),
    [options, query],
  );
  const canCreate = !!onCreate && query.trim() && !options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());
  const total = filtered.length + (canCreate ? 1 : 0);

  const pick = (i: number) => {
    if (i < filtered.length) onChange(filtered[i].value);
    else if (canCreate) onCreate!(query.trim());
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && total ? `${id}-${active}` : undefined}
        className={cn(inputCls, "pr-8 font-normal")}
        placeholder={selected ? selected.label : placeholder}
        value={open ? query : (selected?.label ?? "")}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, total - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open && total) {
            e.preventDefault();
            pick(active);
            inputRef.current?.blur();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {allowClear && selected && !open && (
        <button
          type="button"
          aria-label={`Vider ${label}`}
          onClick={() => onChange(null)}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#9AA0AA] hover:text-white"
        >
          ×
        </button>
      )}
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[#2C3038] bg-[#1A1C21] p-1 shadow-[0_14px_30px_rgba(0,0,0,0.5)]"
        >
          {total === 0 && <li className="px-2.5 py-2 text-[13px] text-[#9AA0AA]">Aucun résultat</li>}
          {filtered.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(i);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-[14px]",
                i === active ? "bg-[#22252B]" : "",
                o.value === value && "font-bold text-white",
              )}
            >
              <span className="truncate">{o.label}</span>
              {o.hint && <span className="flex-none text-[12px] text-[#9AA0AA]">{o.hint}</span>}
            </li>
          ))}
          {canCreate && (
            <li
              id={`${id}-${filtered.length}`}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(filtered.length);
              }}
              onMouseEnter={() => setActive(filtered.length)}
              className={cn("cursor-pointer rounded-md px-2.5 py-2 text-[14px] text-[#8AB4FF]", active === filtered.length && "bg-[#22252B]")}
            >
              {createLabel(query.trim())}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
