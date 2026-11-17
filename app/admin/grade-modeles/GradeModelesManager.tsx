"use client";

import {
  Button,
  Notice,
  Panel,
  Select,
  TextInput,
} from "@/app/_composents/admin/ui";
import { saveGradeModeles } from "@/lib/admin/actions/grade-modeles";
import {
  GROUPE_TYPES,
  GROUPE_TYPE_META,
  type GroupeType,
} from "@/lib/groupe-types";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Grade = { key: string; nom: string; color: string };
type Modele = {
  key: string;
  id: string | null;
  nom: string;
  type: "" | GroupeType;
  grades: Grade[];
};

// Mêmes couleurs par défaut que l'éditeur de groupe, du plus haut au plus bas.
const GRADE_PALETTE = [
  "#E4B44A",
  "#8AB4FF",
  "#6EE7A0",
  "#FF8A8E",
  "#C98BFF",
  "#9AA0AA",
];

let seq = 0;

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

const arrowBtn =
  "flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30";

export default function GradeModelesManager({ initial }: { initial: Modele[] }) {
  const router = useRouter();
  const [modeles, setModeles] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const dirty = JSON.stringify(modeles) !== JSON.stringify(initial);

  const patch = (key: string, p: Partial<Modele>) =>
    setModeles(modeles.map((m) => (m.key === key ? { ...m, ...p } : m)));

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await saveGradeModeles(
        modeles.map((m) => ({
          id: m.id,
          nom: m.nom,
          type: m.type || null,
          grades: m.grades.map((g) => ({ nom: g.nom, color: g.color || null })),
        })),
      );
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      setMsg({ tone: "ok", text: "Modèles enregistrés." });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {modeles.length === 0 && (
        <p className="m-0 text-[13px] text-[#9AA0AA]">Aucun modèle.</p>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {modeles.map((m, mi) => (
          <Panel
            key={m.key}
            legend={m.nom || "Nouveau modèle"}
            aside={
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Monter ${m.nom || "ce modèle"}`}
                  disabled={mi === 0}
                  onClick={() => setModeles(move(modeles, mi, mi - 1))}
                  className={arrowBtn}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Descendre ${m.nom || "ce modèle"}`}
                  disabled={mi === modeles.length - 1}
                  onClick={() => setModeles(move(modeles, mi, mi + 1))}
                  className={arrowBtn}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Supprimer ${m.nom || "ce modèle"}`}
                  onClick={() =>
                    setModeles(modeles.filter((x) => x.key !== m.key))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#2C3038] text-[#A3A8B3] hover:text-[#FF8A8E]"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            }
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <TextInput
                  aria-label="Nom du modèle"
                  placeholder="Ex. MC, Mécano…"
                  value={m.nom}
                  onChange={(e) => patch(m.key, { nom: e.target.value })}
                  className="min-w-40 flex-[1_1_180px]"
                />
                <Select
                  aria-label="Type de groupe"
                  value={m.type}
                  onChange={(e) =>
                    patch(m.key, { type: e.target.value as "" | GroupeType })
                  }
                  className="w-44 flex-none"
                >
                  <option value="">Tous les types</option>
                  {GROUPE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {GROUPE_TYPE_META[t].label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                {m.grades.length === 0 && (
                  <p className="m-0 text-[13px] text-[#9AA0AA]">Aucun grade.</p>
                )}
                {m.grades.map((g, gi) => {
                  const setGrades = (grades: Grade[]) =>
                    patch(m.key, { grades });
                  return (
                    <div
                      key={g.key}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-[#23262D] bg-[#0B0C0F] p-2"
                    >
                      <span className="flex flex-none flex-col">
                        <button
                          type="button"
                          aria-label={`Monter ${g.nom || "ce grade"}`}
                          disabled={gi === 0}
                          onClick={() => setGrades(move(m.grades, gi, gi - 1))}
                          className={arrowBtn}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Descendre ${g.nom || "ce grade"}`}
                          disabled={gi === m.grades.length - 1}
                          onClick={() => setGrades(move(m.grades, gi, gi + 1))}
                          className={arrowBtn}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </span>
                      <TextInput
                        aria-label="Nom du grade"
                        placeholder="Ex. Sergent d’armes"
                        value={g.nom}
                        onChange={(e) =>
                          setGrades(
                            m.grades.map((x) =>
                              x.key === g.key ? { ...x, nom: e.target.value } : x,
                            ),
                          )
                        }
                        className="min-w-32 flex-[1_1_150px]"
                      />
                      <input
                        type="color"
                        aria-label={`Couleur de ${g.nom || "ce grade"}`}
                        value={g.color || "#9AA0AA"}
                        onChange={(e) =>
                          setGrades(
                            m.grades.map((x) =>
                              x.key === g.key ? { ...x, color: e.target.value } : x,
                            ),
                          )
                        }
                        className="h-9 w-10 flex-none cursor-pointer rounded-md border border-[#3A3E47] bg-transparent p-1"
                      />
                      <button
                        type="button"
                        aria-label={`Retirer ${g.nom || "ce grade"}`}
                        onClick={() =>
                          setGrades(m.grades.filter((x) => x.key !== g.key))
                        }
                        className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[#2C3038] text-[#A3A8B3] hover:text-[#FF8A8E]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
                <Button
                  className="self-start"
                  onClick={() =>
                    patch(m.key, {
                      grades: [
                        ...m.grades,
                        {
                          key: `new-${++seq}`,
                          nom: "",
                          color: GRADE_PALETTE[m.grades.length % GRADE_PALETTE.length],
                        },
                      ],
                    })
                  }
                >
                  + Ajouter un grade
                </Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          onClick={() =>
            setModeles([
              ...modeles,
              { key: `new-${++seq}`, id: null, nom: "", type: "", grades: [] },
            ])
          }
        >
          + Nouveau modèle
        </Button>
        <Button variant="primary" disabled={pending || !dirty} onClick={save}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button disabled={!dirty || pending} onClick={() => setModeles(initial)}>
          Annuler
        </Button>
        <span className="text-[12px] text-[#9AA0AA]">
          Du plus haut au plus bas. Un modèle se copie dans un groupe depuis son
          éditeur : le changer ici n’affecte pas les groupes déjà créés.
        </span>
      </div>
    </div>
  );
}
