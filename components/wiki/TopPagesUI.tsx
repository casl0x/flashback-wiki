"use client";

// components/TopPagesUI.tsx

interface PageStat {
  path: string;
  views: number;
}

interface TopPagesUIProps {
  pages: PageStat[];
  error: string | null;
  title: string;
  since: string;
  pathPrefix?: string;
}

const sinceLabel: Record<string, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
};

export default function TopPagesUI({
  pages,
  error,
  title,
  since,
  pathPrefix,
}: TopPagesUIProps) {
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

  // Si toutes les pages partagent un préfixe commun, on l'affiche une seule
  // fois dans le header et on retire le préfixe de chaque ligne pour plus de lisibilité
  const displayPath = (path: string) =>
    pathPrefix ? path.replace(pathPrefix, "") || "/" : path;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {pathPrefix && (
            <p className="mt-0.5 font-mono text-xs text-gray-400">{pathPrefix}/…</p>
          )}
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
          {sinceLabel[since] ?? since}
        </span>
      </div>

      {/* Liste */}
      <ul className="divide-y divide-gray-50 px-5 py-2">
        {pages.map((page, index) => {
          const barWidth = Math.round((page.views / maxViews) * 100);
          const label = displayPath(page.path);

          return (
            <li key={page.path} className="group flex items-center gap-3 py-3">
              {/* Rang */}
              <span className="w-5 shrink-0 text-center text-xs font-medium text-gray-400">
                {index + 1}
              </span>

              {/* Chemin + barre */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="truncate font-mono text-sm font-medium text-gray-700 group-hover:text-gray-900"
                    title={page.path}
                  >
                    {label}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                    {page.views.toLocaleString("fr-FR")}
                  </span>
                </div>

                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-black transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
        Données Vercel Web Analytics · Mis à jour toutes les heures
      </div>
    </div>
  );
}