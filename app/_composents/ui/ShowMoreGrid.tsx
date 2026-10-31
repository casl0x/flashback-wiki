"use client";

import { Children, useState, type ReactNode } from "react";

/** Grille limitée à `limit` éléments, avec un bouton « Voir plus » pour afficher le reste. */
export default function ShowMoreGrid({
  children,
  limit = 6,
  className,
}: {
  children: ReactNode;
  limit?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  const hidden = items.length - limit;

  return (
    <div className="flex min-w-0  flex-col gap-2.5">
      <div className={className}>{open ? items : items.slice(0, limit)}</div>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="min-h-11 self-start rounded-lg border border-[#3A3E47] px-4 text-[14px] font-bold text-[#C4C7CF] hover:border-[#6E7380] w-full"
        >
          {open ? "Voir moins" : `Voir plus (${hidden})`}
        </button>
      )}
    </div>
  );
}
