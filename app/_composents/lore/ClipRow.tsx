"use client";

import { CLIP_PLATFORM_LABEL, type LoreClip } from "@/lib/lore";
import { cn } from "@/lib/utils";
import { ExternalLink, Play } from "lucide-react";
import { useState } from "react";

/** Rangée de clips à faire défiler ; un clic lit le clip sur place (YouTube, Twitch). */
export default function ClipRow({ clips, color }: { clips: LoreClip[]; color: string }) {
  if (clips.length === 0) return null;
  return (
    <div className="mt-4">
      <div
        data-no-swipe
        className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2"
        style={{ "--c": color } as React.CSSProperties}
      >
        {clips.map((c, i) => (
          <ClipCard key={`${c.url}-${i}`} clip={c} index={i} />
        ))}
      </div>
      {clips.length > 1 && (
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-[#6E7380]">
          {clips.length} clips · fais défiler →
        </p>
      )}
    </div>
  );
}

function ClipCard({ clip, index }: { clip: LoreClip; index: number }) {
  const [playing, setPlaying] = useState(false);
  const label = clip.titre ?? clip.autoTitle ?? `Clip ${index + 1}`;
  const canEmbed = !!clip.embedId;

  const src =
    clip.platform === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${clip.embedId}?autoplay=1`
      : clip.platform === "twitch"
        ? `https://clips.twitch.tv/embed?clip=${clip.embedId}&parent=${
            typeof window === "undefined" ? "" : window.location.hostname
          }&autoplay=true`
        : null;

  return (
    <div className="w-[min(85vw,28rem)] flex-none snap-start overflow-hidden rounded-[10px] border border-[#2a2d35] bg-black transition-colors hover:border-(--c)">
      <div className="relative aspect-video">
        {playing && src ? (
          <iframe
            src={src}
            title={label}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => (canEmbed ? setPlaying(true) : window.open(clip.url, "_blank", "noopener,noreferrer"))}
            aria-label={canEmbed ? `Lire : ${label}` : `Ouvrir : ${label}`}
            className="group absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(135deg,#15171c_0_10px,#101216_10px_20px)]"
          >
            {clip.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clip.thumbnail} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <span
              className={cn(
                "relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black transition-transform group-hover:scale-110",
              )}
            >
              {canEmbed ? <Play className="h-6 w-6 translate-x-0.5 fill-current" /> : <ExternalLink className="h-6 w-6" />}
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-[#8D93A0]">
        <b className="min-w-0 truncate font-semibold text-white">{label}</b>
        <a
          href={clip.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-none hover:text-white"
          title="Ouvrir sur la plateforme"
        >
          {CLIP_PLATFORM_LABEL[clip.platform]}
        </a>
      </div>
    </div>
  );
}
