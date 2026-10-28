"use client";

import {
  Button,
  Notice,
  Panel,
  TextInput,
} from "@/app/_composents/admin/ui";
import { saveCategories } from "@/lib/admin/actions/groupes";
import type { GroupeType } from "@/lib/groupe-types";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Row = { key: string; id: string | null; nom: string; groupes: number };

let seq = 0;

export default function CategoriesManager({
  type,
  title,
  initial,
}: {
  type: GroupeType;
  title: string;
  initial: Row[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);

  const move = (i: number, to: number) => {
    if (to < 0 || to >= rows.length) return;
    const r = [...rows];
    const [x] = r.splice(i, 1);
    r.splice(to, 0, x);
    setRows(r);
  };

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await saveCategories(
        type,
        rows.map((c) => ({ id: c.id, nom: c.nom })),
      );
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      setMsg({ tone: "ok", text: "Catégories enregistrées." });
      router.refresh();
    });

  return (
    <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Panel
        legend={title}
        aside={
          <span className="text-[12px] text-[#9AA0AA]">Dans l’ordre d’affichage</span>
        }
      >
        <div className="flex flex-col gap-2">
          {rows.length === 0 && (
            <p className="m-0 text-[13px] text-[#9AA0AA]">
              Aucune catégorie. Les groupes sont listés dans « Autres ».
            </p>
          )}
          {rows.map((c, i) => (
            <div
              key={c.key}
              className="flex items-center gap-2 rounded-lg border border-[#23262D] bg-[#0B0C0F] p-2"
            >
              <span className="flex flex-none flex-col">
                <button
                  type="button"
                  aria-label={`Monter ${c.nom || "cette catégorie"}`}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  className="flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Descendre ${c.nom || "cette catégorie"}`}
                  disabled={i === rows.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </span>
              <TextInput
                aria-label="Nom de la catégorie"
                placeholder="Ex. Automobile"
                value={c.nom}
                onChange={(e) =>
                  setRows(
                    rows.map((x) =>
                      x.key === c.key ? { ...x, nom: e.target.value } : x,
                    ),
                  )
                }
                className="min-w-0 flex-1"
              />
              <span className="w-20 flex-none text-[12px] text-[#9AA0AA]">
                {c.groupes
                  ? `${c.groupes} groupe${c.groupes > 1 ? "s" : ""}`
                  : ""}
              </span>
              <button
                type="button"
                aria-label={`Retirer ${c.nom || "cette catégorie"}`}
                onClick={() => setRows(rows.filter((x) => x.key !== c.key))}
                className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[#2C3038] text-[#A3A8B3] hover:text-[#FF8A8E]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() =>
                setRows([
                  ...rows,
                  { key: `new-${++seq}`, id: null, nom: "", groupes: 0 },
                ])
              }
            >
              + Ajouter une catégorie
            </Button>
            <Button
              variant="primary"
              disabled={pending || !dirty}
              onClick={save}
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button disabled={!dirty || pending} onClick={() => setRows(initial)}>
              Annuler
            </Button>
          </div>
          <span className="text-[12px] text-[#9AA0AA]">
            Retirer une catégorie place ses groupes dans « Autres ».
          </span>
        </div>
      </Panel>
    </div>
  );
}
