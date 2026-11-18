import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Pages privées / techniques : inutiles à indexer.
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/profil", "/sign-in", "/sign-up"] },
      // Crawlers d'entraînement IA bloqués (conserve le comportement de l'ancien robots.txt).
      { userAgent: ["GPTBot", "CCBot", "anthropic-ai", "Google-Extended"], disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
