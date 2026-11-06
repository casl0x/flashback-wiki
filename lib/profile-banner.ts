export const DEFAULT_BANNER_COLOR = "#2F6FEB";
export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Dégradé de la bannière de profil : couleur choisie, sinon fallback selon le statut créateur. */
export function bannerBackground(
  color: string | null | undefined,
  isCreator: boolean,
): string {
  if (color) return `linear-gradient(135deg, ${color}, #0E0F12)`;
  return isCreator
    ? `linear-gradient(135deg, ${DEFAULT_BANNER_COLOR}, #0E0F12)`
    : "repeating-linear-gradient(135deg, #1A1C21 0 14px, #17191D 14px 28px)";
}
