import SectionTitle from "@/app/_composents/characters/SectionTitle";
import SoundList from "@/app/_composents/characters/SoundList";
import type { MusicTrack } from "@/lib/music";

/** Toutes les musiques des persos du joueur, directement sur sa fiche. */
export default function PlayerMusic({ tracks }: { tracks: MusicTrack[] }) {
  if (tracks.length === 0) return null;
  return (
    <section aria-labelledby="player-music-h" className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <SectionTitle id="player-music-h">Musiques</SectionTitle>
        <span className="text-[13px] text-[#9AA0AA]">
          {tracks.length} son{tracks.length > 1 ? "s" : ""}
        </span>
      </div>
      <SoundList sounds={tracks} />
    </section>
  );
}
