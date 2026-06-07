import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-text-primary">
      <p className="text-[11px] uppercase tracking-[0.22em] text-text-faint">
        404
      </p>
      <h1 className="font-display text-2xl font-bold">Page introuvable</h1>
      <p className="text-sm text-text-secondary">
        Cette page n&apos;existe pas ou a été supprimée.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg border border-border px-4 py-2 text-sm text-text-primary hover:bg-surface transition-colors"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
