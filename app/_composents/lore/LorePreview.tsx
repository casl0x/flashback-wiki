"use client";

import { useState } from "react";
import LoreText from "./LoreText";

/** Aperçu en direct d'un texte Markdown du Lore, à la couleur de la version. */
export default function LorePreview({ text, color }: { text: string; color: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-[12px] font-semibold text-[#9AA0AA] hover:text-white"
      >
        {open ? "▾ Masquer l’aperçu" : "▸ Afficher l’aperçu"}
      </button>
      {open && (
        <div
          className="mt-1.5 rounded-lg border border-dashed border-[#3A3E47] bg-[#080808] p-4"
          style={{ "--c": color } as React.CSSProperties}
        >
          {text.trim() ? (
            <LoreText text={text} />
          ) : (
            <p className="m-0 text-[13px] text-[#6E7380]">L’aperçu apparaît ici dès que tu écris.</p>
          )}
        </div>
      )}
    </div>
  );
}
