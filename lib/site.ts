// URL publique du site : base des URL absolues (sitemap, canonical, Open Graph).
// Surchargeable via NEXT_PUBLIC_SITE_URL (ex. preview), sans slash final.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://flashbackwiki.bycaslox.com"
).replace(/\/$/, "");

export const SITE_NAME = "Flashback Wiki";
