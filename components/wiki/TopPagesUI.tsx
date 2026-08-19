"use client";

interface PageStat {
  path: string;
  name: string;
  views: number;
}

interface TopPagesUIProps {
  pages: PageStat[];
  error: string | null;
  title: string;
  since: string;
}

const sinceLabel: Record<string, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
};

export default function TopPagesUI({ pages, error, title, since }: TopPagesUIProps) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <strong>Erreur :</strong> {error}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        Aucune donnée disponible pour cette période.
      </div>
    );
  }

  const maxViews = pages[0].views;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {sinceLabel[since] ?? since}
        </span>
      </div>

      {/* Liste */}
      <ul className="divide-y divide-border px-5 py-2">
        {pages.map((page, index) => {
          const barWidth = Math.round((page.views / maxViews) * 100);

          return (
            <li key={page.path} className="group flex items-center gap-3 py-3">
              {/* Rang */}
              <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>

              {/* Nom + barre */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={page.path}
                    className="truncate text-sm font-medium hover:underline"
                    title={page.nom}
                  >
                    {page.nom}
                  </a>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                    {page.views.toLocaleString("fr-FR")} vues
                  </span>
                </div>

                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        Données Vercel Web Analytics · Mis à jour toutes les heures
      </div>
    </div>
  );
}
