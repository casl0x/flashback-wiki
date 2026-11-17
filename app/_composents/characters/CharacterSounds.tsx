"use client";

import type { CharacterSound } from "@/lib/character-page";
import SectionTitle from "./SectionTitle";
import SoundList from "./SoundList";

/** Liste des sons du perso. */
export default function CharacterSounds({ sounds }: { sounds: CharacterSound[] }) {
  if (sounds.length === 0) return null;

  return (
    <section aria-labelledby="sons-h" className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <SectionTitle id="sons-h">Sons</SectionTitle>
        <span className="text-[13px] text-[#9AA0AA]">
          {sounds.length} son{sounds.length > 1 ? "s" : ""}
        </span>
      </div>
      <SoundList sounds={sounds} />
    </section>
  );
}
