"use client";

import ImageUpload from "@/app/_composents/admin/ImageUpload";
import SearchSelect from "@/app/_composents/admin/SearchSelect";
import {
  Button,
  ButtonLink,
  Field,
  Notice,
  PageHeader,
  Panel,
  Select,
  TextArea,
  TextInput,
} from "@/app/_composents/admin/ui";
import {
  deleteGroupe,
  mergeGroupe,
  saveGroupe,
} from "@/lib/admin/actions/groupes";
import { slugify } from "@/lib/admin/slug";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Grade = {
  key: string;
  id: string | null;
  nom: string;
  niveau: string;
  members: number;
};
type G = {
  id: string | null;
  nom: string;
  slug: string;
  color: string;
  description: string;
  imageUrl: string | null;
  grades: Grade[];
};

// Niveau = couleur de la rangée sur la page du groupe.
const NIVEAUX = [
  { value: "", label: "—" },
  { value: "commandement", label: "Commandement" },
  { value: "encadrement", label: "Encadrement" },
  { value: "agents", label: "Agents" },
];

let seq = 0;

export default function GroupeEditor({
  initial,
  members,
  presence,
  others,
}: {
  initial: G;
  members: number;
  presence: { id: string; color: string; count: number }[];
  others: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);

  const setGrades = (grades: Grade[]) => setF({ ...f, grades });
  const moveGrade = (i: number, to: number) => {
    if (to < 0 || to >= f.grades.length) return;
    const g = [...f.grades];
    const [x] = g.splice(i, 1);
    g.splice(to, 0, x);
    setGrades(g);
  };

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await saveGroupe(f.id, {
        nom: f.nom,
        slug: f.slug,
        color: f.color,
        description: f.description,
        imageUrl: f.imageUrl,
        grades: f.grades.map((g) => ({
          id: g.id,
          nom: g.nom,
          niveau: g.niveau || null,
        })),
      });
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      setMsg({ tone: "ok", text: "Groupe enregistré." });
      if (!f.id) router.replace(`/admin/groupes/${r.data.id}`);
      else router.refresh();
    });

  const remove = () => {
    if (!f.id) return;
    if (!confirmDelete) return setConfirmDelete(true);
    start(async () => {
      const r = await deleteGroupe(f.id!);
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      router.push("/admin/groupes");
      router.refresh();
    });
  };

  const merge = () =>
    start(async () => {
      if (!f.id || !mergeTarget) return;
      const r = await mergeGroupe(f.id, mergeTarget);
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      router.push(`/admin/groupes/${mergeTarget}`);
      router.refresh();
    });

  return (
    <>
      <PageHeader
        back={{ href: "/admin/groupes", label: "Groupes" }}
        title={f.nom || "Nouveau groupe"}
        meta={
          f.id
            ? `${members} membre${members > 1 ? "s" : ""} · ${presence.length} période${presence.length > 1 ? "s" : ""}`
            : "Pas encore enregistré"
        }
        actions={
          <>
            {f.id && (
              <ButtonLink href={`/groupes/${initial.slug}`} target="_blank">
                Voir sur le site ↗
              </ButtonLink>
            )}
            <Button
              variant="primary"
              disabled={pending || !dirty}
              onClick={save}
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        }
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <div className="flex flex-wrap items-start gap-5">
        <form
          className="flex min-w-0 flex-[999_1_560px] flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Panel legend="Identité">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Nom">
                <TextInput
                  value={f.nom}
                  required
                  onChange={(e) =>
                    setF({
                      ...f,
                      nom: e.target.value,
                      slug: slugTouched ? f.slug : slugify(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Slug">
                <span className="flex items-center">
                  <span className="flex min-h-10 items-center rounded-l-lg border border-r-0 border-[#3A3E47] bg-[#1A1C21] px-2.5 text-[13px] font-normal text-[#9AA0AA]">
                    /groupes/
                  </span>
                  <TextInput
                    value={f.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setF({ ...f, slug: e.target.value });
                    }}
                    className="rounded-l-none"
                  />
                </span>
              </Field>
              <Field
                label="Couleur"
                className="sm:col-span-2"
                hint="Sert aussi d’accent sur la fiche de chaque membre."
              >
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Choisir la couleur"
                    value={f.color}
                    onChange={(e) => setF({ ...f, color: e.target.value })}
                    className="h-10 w-12 flex-none cursor-pointer rounded-lg border border-[#3A3E47] bg-transparent p-1"
                  />
                  <TextInput
                    value={f.color}
                    onChange={(e) => setF({ ...f, color: e.target.value })}
                    className="max-w-35 font-mono"
                    aria-label="Couleur (hex)"
                  />
                </span>
              </Field>
              {presence.length > 0 && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-[13px] font-semibold text-[#C4C7CF]">
                    Présent sur
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {presence.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-bold text-[#121212]"
                        style={{ background: p.color }}
                      >
                        {p.id} · {p.count}
                      </span>
                    ))}
                  </span>
                  <span className="text-[12px] text-[#9AA0AA]">
                    Calculé automatiquement à partir des persos du groupe.
                  </span>
                </div>
              )}
            </div>
          </Panel>

          <Panel
            legend="Grades"
            aside={
              <span className="text-[12px] text-[#9AA0AA]">
                Du plus haut au plus bas
              </span>
            }
          >
            <div className="flex flex-col gap-2">
              {f.grades.length === 0 && (
                <p className="m-0 text-[13px] text-[#9AA0AA]">
                  Aucun grade. Les membres seront listés sans hiérarchie.
                </p>
              )}
              {f.grades.map((g, i) => (
                <div
                  key={g.key}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-[#23262D] bg-[#0B0C0F] p-2"
                >
                  <span className="flex flex-none flex-col">
                    <button
                      type="button"
                      aria-label={`Monter ${g.nom || "ce grade"}`}
                      disabled={i === 0}
                      onClick={() => moveGrade(i, i - 1)}
                      className="flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Descendre ${g.nom || "ce grade"}`}
                      disabled={i === f.grades.length - 1}
                      onClick={() => moveGrade(i, i + 1)}
                      className="flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </span>
                  <TextInput
                    aria-label="Nom du grade"
                    placeholder="Ex. Sergent"
                    value={g.nom}
                    onChange={(e) =>
                      setGrades(
                        f.grades.map((x) =>
                          x.key === g.key ? { ...x, nom: e.target.value } : x,
                        ),
                      )
                    }
                    className="min-w-40 flex-[1_1_200px]"
                  />
                  <Select
                    aria-label="Niveau"
                    value={g.niveau}
                    onChange={(e) =>
                      setGrades(
                        f.grades.map((x) =>
                          x.key === g.key
                            ? { ...x, niveau: e.target.value }
                            : x,
                        ),
                      )
                    }
                    className="w-42 flex-none"
                  >
                    {NIVEAUX.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                  </Select>
                  <span className="w-22 flex-none text-[12px] text-[#9AA0AA]">
                    {g.members
                      ? `${g.members} membre${g.members > 1 ? "s" : ""}`
                      : ""}
                  </span>
                  <button
                    type="button"
                    aria-label={`Retirer ${g.nom || "ce grade"}`}
                    onClick={() =>
                      setGrades(f.grades.filter((x) => x.key !== g.key))
                    }
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[#2C3038] text-[#A3A8B3] hover:text-[#FF8A8E]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                className="self-start"
                onClick={() =>
                  setGrades([
                    ...f.grades,
                    {
                      key: `new-${++seq}`,
                      id: null,
                      nom: "",
                      niveau: "",
                      members: 0,
                    },
                  ])
                }
              >
                + Ajouter un grade
              </Button>
              <span className="text-[12px] text-[#9AA0AA]">
                L’ordre range la hiérarchie sur la page du groupe. Retirer un
                grade laisse ses membres sans grade.
              </span>
            </div>
          </Panel>

          <Panel legend="Description">
            <TextArea
              rows={5}
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
              placeholder="Histoire du groupe, changements entre les versions, QG…"
            />
          </Panel>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="submit"
              variant="primary"
              disabled={pending || !dirty}
            >
              Enregistrer
            </Button>
            <Button disabled={!dirty || pending} onClick={() => setF(initial)}>
              Annuler
            </Button>
            {f.id && (
              <span className="ml-auto flex flex-wrap gap-2.5">
                <Button
                  onClick={() => setMergeOpen((o) => !o)}
                  aria-expanded={mergeOpen}
                >
                  Fusionner avec un autre groupe…
                </Button>
                <Button variant="danger" disabled={pending} onClick={remove}>
                  {confirmDelete ? "Confirmer la suppression" : "Supprimer"}
                </Button>
              </span>
            )}
          </div>

          {mergeOpen && f.id && (
            <Panel legend="Fusionner">
              <div className="flex flex-col gap-3">
                <p className="m-0 text-[13px] text-[#C4C7CF]">
                  Tous les membres de <strong>{initial.nom}</strong> passent
                  dans le groupe choisi (grades repris par nom), puis{" "}
                  {initial.nom} est supprimé.
                </p>
                <SearchSelect
                  label="Groupe cible"
                  options={others.map((o) => ({ value: o.id, label: o.nom }))}
                  value={mergeTarget}
                  onChange={setMergeTarget}
                  placeholder="Groupe cible…"
                />
                <Button
                  variant="danger"
                  className="self-start"
                  disabled={!mergeTarget || pending}
                  onClick={merge}
                >
                  Fusionner
                </Button>
              </div>
            </Panel>
          )}
        </form>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <Panel legend="Logo">
            <ImageUpload
              label="logo du groupe"
              value={f.imageUrl}
              onChange={(v) => setF({ ...f, imageUrl: v })}
              hint="PNG ou SVG, fond transparent"
              preview="w_400,h_400,c_pad,b_transparent"
            />
          </Panel>
          <Panel legend="Aperçu de l’en-tête">
            <div
              className="flex items-center gap-3.5 rounded-[10px] p-4"
              style={{ background: f.color }}
            >
              <span className="relative flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-xl bg-black/25 text-[10px] text-white/80">
                {f.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cloudinaryUrl(
                      f.imageUrl,
                      "w_120,h_120,c_pad,b_transparent",
                    )}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  "LOGO"
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
                  Groupe
                </span>
                <span
                  className={cn(
                    anton.className,
                    "block truncate text-[36px] leading-none text-white",
                  )}
                >
                  {f.nom || "Nom"}
                </span>
              </span>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
