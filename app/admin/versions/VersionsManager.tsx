"use client";

import ImageUpload from "@/app/_composents/admin/ImageUpload";
import {
  Button,
  ButtonLink,
  Field,
  Notice,
  PageHeader,
  Panel,
  TextArea,
  TextInput,
} from "@/app/_composents/admin/ui";
import {
  deleteVersion,
  reorderVersions,
  saveVersion,
} from "@/lib/admin/actions/versions";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type V = {
  id: string;
  label: string;
  color: string;
  description: string;
  imageUrl: string | null;
  dateDebut: string;
  dateFin: string;
  enCours: boolean;
  count: number;
};

const EMPTY: V = {
  id: "",
  label: "",
  color: "#8AB4FF",
  description: "",
  imageUrl: null,
  dateDebut: "",
  dateFin: "",
  enCours: false,
  count: 0,
};

export default function VersionsManager({
  versions,
  selected,
}: {
  versions: V[];
  selected: string;
}) {
  const router = useRouter();
  const isNew = selected === "new";
  const initial = isNew ? EMPTY : versions.find((v) => v.id === selected)!;
  const [f, setF] = useState(initial);
  const [order, setOrder] = useState(versions.map((v) => v.id));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  const byId = new Map(versions.map((v) => [v.id, v]));

  const move = (i: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [x] = next.splice(i, 1);
    next.splice(to, 0, x);
    setOrder(next);
    start(async () => {
      const r = await reorderVersions(next);
      if (!r.ok) setMsg({ tone: "error", text: r.error });
      router.refresh();
    });
  };

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await saveVersion(isNew ? null : initial.id, {
        id: f.id,
        label: f.label,
        color: f.color,
        description: f.description,
        imageUrl: f.imageUrl,
        dateDebut: f.dateDebut || null,
        dateFin: f.dateFin || null,
        enCours: f.enCours,
      });
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      setMsg({ tone: "ok", text: "Version enregistrée." });
      router.replace(`/admin/versions?id=${r.data.id}`);
      router.refresh();
    });

  const remove = () => {
    if (!confirmDelete) return setConfirmDelete(true);
    start(async () => {
      const r = await deleteVersion(initial.id);
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      router.replace("/admin/versions");
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader
        title="Versions"
        meta="L’ordre de la liste est celui des bandes sur l’accueil."
        actions={
          <ButtonLink href="/admin/versions?id=new" variant="primary">
            + Nouvelle version
          </ButtonLink>
        }
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <div className="flex flex-wrap items-start gap-5">
        <nav
          aria-label="Versions"
          className="flex min-w-0 flex-[1_1_260px] flex-col overflow-hidden rounded-[10px] border border-[#23262D] lg:max-w-[320px]"
        >
          {order.map((id, i) => {
            const v = byId.get(id)!;
            const on = id === selected;
            return (
              <div
                key={id}
                className={cn(
                  "flex items-center gap-2 border-b border-[#23262D] px-2 py-2.5 last:border-b-0",
                  on ? "bg-[#1A2233]" : "bg-[#15171B]",
                )}
              >
                <span className="flex flex-none flex-col">
                  <button
                    type="button"
                    aria-label={`Monter ${v.id}`}
                    disabled={i === 0 || pending}
                    onClick={() => move(i, i - 1)}
                    className="flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Descendre ${v.id}`}
                    disabled={i === order.length - 1 || pending}
                    onClick={() => move(i, i + 1)}
                    className="flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </span>
                <Link
                  href={`/admin/versions?id=${v.id}`}
                  aria-current={on ? "page" : undefined}
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                  <span
                    className={cn(
                      anton.className,
                      "w-12 flex-none text-[24px] leading-none",
                    )}
                    style={{ color: v.color }}
                  >
                    {v.id}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{v.label}</span>
                    <span className="text-[12px] text-[#9AA0AA]">
                      {v.count} persos
                    </span>
                  </span>
                  {v.enCours && (
                    <span className="ml-auto flex-none rounded-full bg-[#11281C] px-2 py-px text-[11px] font-bold text-[#6EE7A0]">
                      En cours
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
          {isNew && (
            <div className="border-t border-[#23262D] bg-[#1A2233] px-3 py-3 font-semibold">
              Nouvelle version…
            </div>
          )}
        </nav>

        <form
          className="flex min-w-0 flex-[999_1_480px] flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Panel legend={isNew ? "Nouvelle version" : `Version ${initial.id}`}>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field
                label="Identifiant"
                hint={
                  isNew
                    ? "Ex. V7. Ne pourra plus être changé."
                    : "Ne peut pas être changé."
                }
              >
                <TextInput
                  value={f.id}
                  readOnly={!isNew}
                  onChange={(e) =>
                    setF({ ...f, id: e.target.value.toUpperCase() })
                  }
                  required
                  className={cn(!isNew && "opacity-60")}
                />
              </Field>
              <Field label="Nom affiché">
                <TextInput
                  value={f.label}
                  onChange={(e) => setF({ ...f, label: e.target.value })}
                  placeholder="Version 7"
                  required
                />
              </Field>
              <label className="flex min-h-10 items-center justify-between gap-3 self-end rounded-lg border border-[#3A3E47] bg-[#0B0C0F] px-3 text-[13px] font-semibold text-[#C4C7CF] sm:col-span-2">
                Version en cours
                <input
                  type="checkbox"
                  checked={f.enCours}
                  onChange={(e) => setF({ ...f, enCours: e.target.checked })}
                  className="h-5 w-5 accent-[#2F6FEB]"
                />
              </label>
              <Field label="Début">
                <TextInput
                  type="date"
                  value={f.dateDebut}
                  onChange={(e) => setF({ ...f, dateDebut: e.target.value })}
                />
              </Field>
              <Field
                label="Fin"
                hint={
                  f.enCours
                    ? "Pas de date de fin tant que la version est en cours."
                    : undefined
                }
              >
                <TextInput
                  type="date"
                  value={f.enCours ? "" : f.dateFin}
                  disabled={f.enCours}
                  onChange={(e) => setF({ ...f, dateFin: e.target.value })}
                />
              </Field>
              <Field label="Couleur" className="sm:col-span-2">
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
              <Field label="Description" className="sm:col-span-2">
                <TextArea
                  rows={4}
                  value={f.description}
                  onChange={(e) => setF({ ...f, description: e.target.value })}
                  placeholder="Ce qui a changé sur cette version : nouvelle map, nouveaux groupes, événements marquants…"
                />
              </Field>
            </div>
          </Panel>

          <Panel legend="Image d’ambiance">
            <ImageUpload
              label="image d’ambiance"
              value={f.imageUrl}
              onChange={(v) => setF({ ...f, imageUrl: v })}
              hint="Image large (paysage)"
              preview="w_1200,h_520,c_fill"
              aspect="wide"
            />
          </Panel>

          <Panel legend="Aperçu de la bande sur l’accueil">
            <div className="relative h-40 overflow-hidden rounded-[10px] bg-[#1A1C21]">
              {f.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cloudinaryUrl(f.imageUrl, "w_1200,h_520,c_fill")}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <span className="absolute inset-0 bg-linear-to-t from-[#0E0F12] to-transparent" />
              <span
                className="absolute inset-x-0 bottom-0 h-1"
                style={{ background: f.color }}
              />
              <span className="absolute bottom-4 left-4 flex flex-col">
                <span
                  className={cn(anton.className, "text-[44px] leading-none")}
                  style={{ color: f.color }}
                >
                  {f.id || "V?"}
                </span>
                <span className="font-semibold">
                  {f.label || "Nom affiché"}
                </span>
              </span>
            </div>
          </Panel>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="submit"
              variant="primary"
              disabled={pending || !dirty}
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button disabled={!dirty || pending} onClick={() => setF(initial)}>
              Annuler
            </Button>
            {!isNew && (
              <Button
                variant="danger"
                className="ml-auto"
                disabled={pending}
                onClick={remove}
              >
                {confirmDelete
                  ? `Confirmer (${initial.count} persos perdront cette version)`
                  : "Supprimer la version"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
