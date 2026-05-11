"use client";

import { Badge } from "@/components/ui/badge";
import PlayerCard from "@/components/wiki/PlayerCard";
import { Character } from "@/lib/db";

type Props = {
  character: Character;
  allCharacters: Character[];
  onBack: () => void;
  onNavigate: (c: Character) => void;
};

export default function CharacterDetail({
  character: c,
  allCharacters,
  onBack,
  onNavigate,
}: Props) {
  const rels = c.relations ?? [];
  const others = allCharacters.filter(
    (x) => x.playerId === c.playerId && x.id !== c.id,
  );

  return (
    <div className="flex-1 p-5 overflow-y-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary mb-3.5 transition-colors bg-transparent border-none cursor-pointer"
      >
        <i className="ti ti-arrow-left" aria-hidden="true" /> Retour
      </button>

      <div className="flex flex-col gap-3">
        {/* Fiche personnage */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3.5 mb-4 pb-3.5 border-b border-border">
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-[20px] text-text-primary tracking-wide">
                {c.nom}
              </h2>
              {c.metier && (
                <p className="text-[13px] text-text-muted mb-1.5">
                  Métier : {c.metier}
                </p>
              )}
              {c.groupe && (
                <p className="text-[13px] text-text-muted mb-1.5">
                  Groupe : {c.groupe}
                </p>
              )}

              <div className="flex items-center gap-1.5 flex-wrap pt-4">
                {c.version && (
                  <Badge
                    variant="outline"
                    style={{
                      color: c.version.color ?? "var(--accent)",
                      borderColor: `${c.version.color ?? "var(--accent)"}40`,
                      background: `${c.version.color ?? "var(--accent)"}18`,
                    }}
                  >
                    {c.version.id} — {c.version.label}
                  </Badge>
                )}
                {c.role && (
                  <Badge variant="ghost">
                    {c.role === "civil" ? "Civil" : "Illégal"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {c.description && (
            <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
              {c.description}
            </p>
          )}

          {rels.length > 0 && (
            <div>
              <p className="text-[9px] font-semibold text-text-faint uppercase tracking-[.8px] mb-2">
                Relations
              </p>
              <div className="flex flex-col gap-1.5">
                {rels.map((r) => {
                  const full = allCharacters.find(
                    (ch) => ch.id === r.linked.id,
                  );
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (full) onNavigate(full);
                      }}
                      className="flex items-center justify-between px-3 py-2 bg-elevated rounded-lg border border-transparent hover:border-border-mid transition-all text-left w-full"
                    >
                      <div className="flex items-center gap-2">
                        {r.type_relation && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-bg border border-border-accent text-accent-light font-display tracking-wide shrink-0">
                            {r.type_relation}
                          </span>
                        )}
                        <div>
                          <p className="text-[13px] font-medium text-text-primary">
                            {r.linked.nom}
                          </p>
                          <p className="text-[10px] text-text-faint">
                            {r.linked.player_pseudo &&
                              `@${r.linked.player_pseudo}`}
                            {r.linked.player_pseudo &&
                              (r.linked.metier || r.linked.groupe) &&
                              " — "}
                            {r.linked.metier && (
                              <span>Métier : {r.linked.metier}</span>
                            )}
                            {r.linked.metier && r.linked.groupe && " · "}
                            {r.linked.groupe && (
                              <span>Groupe : {r.linked.groupe}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <i
                        className="ti ti-chevron-right text-text-muted text-[12px] shrink-0"
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {c.lienReddif && (
            <div className="pt-4">
              <p className="text-[9px] font-semibold text-text-faint uppercase tracking-[.8px] ">
                Playlist Reddif
              </p>
              <a
                href={c.lienReddif}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] text-accent-light hover:underline mb-3"
              >
                <i className="ti ti-brand-youtube" aria-hidden="true" />
                Voir la reddif
              </a>
            </div>
          )}
        </div>

        <PlayerCard player={c.player} others={others} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
