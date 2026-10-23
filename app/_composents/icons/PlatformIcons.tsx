export const TWITCH_COLOR = "#9146ff";
export const KICK_COLOR = "#53FC18";

export function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={TWITCH_COLOR}
      className={className}
      aria-hidden="true"
    >
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  );
}

// Kick n'a pas de logo simple en path SVG public — on rend un monogramme
// dans la couleur de marque plutôt que d'approximer leur wordmark.
export function KickIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="5" fill={KICK_COLOR} />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fontFamily="sans-serif"
        fill="#000"
      >
        K
      </text>
    </svg>
  );
}
