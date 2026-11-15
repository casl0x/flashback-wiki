"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  /** Destination de secours (accès direct, lien externe, nouvel onglet…). */
  href: string;
  className?: string;
  children: ReactNode;
};

/**
 * Lien « retour » : revient à la page précédente de l'historique quand elle
 * appartient au site (liste, groupe, profil…), sinon va vers `href`.
 */
export default function BackLink({ href, className, children }: Props) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        try {
          const sameOrigin =
            !!document.referrer &&
            new URL(document.referrer).origin === window.location.origin;
          if (window.history.length > 1 && sameOrigin) {
            e.preventDefault();
            router.back();
          }
        } catch {}
      }}
    >
      {children}
    </Link>
  );
}
