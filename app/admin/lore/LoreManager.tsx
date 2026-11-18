"use client";

import SearchSelect, { type Option } from "@/app/_composents/admin/SearchSelect";
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
  deleteLoreEvent,
  reorderLoreEvents,
  saveLoreEvent,
} from "@/lib/admin/actions/lore";
import type { LoreClipInput } from "@/lib/lore";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type VersionItem = { id: string; label: string; color: string; count: number };
type EventItem = {
  id: string;
  titre: string;
  resume: string;
  major: boolean;
  versionId: string;
  clips: LoreClipInput[];
  characterIds: string[];
  groupeIds: string[];
};

type Form = Omit<EventItem, "id">;

export default function LoreManager({
  versionId,
  selected,
  versions,
  events,
  characters,
  groupes,
}: {
  versionId: string;
  selected: string;
  versions: VersionItem[];
  events: EventItem[];
  characters: Option[];
  groupes: Option[];
}) {
  const router = useRouter();
  const isNew = selected === "new";
  const current = events.find((e) => e.id === selected);
  const initial: Form = current ?? {
    titre: "",
    resume: "",
    major: false,
    versionId,
    clips: [],
    characterIds: [],
    groupeIds: [],
  };
  const [f, setF] = useState<Form>(initial);
  const [order, setOrder] = useState(events.map((e) => e.id));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const byId = new Map(events.map((e) => [e.id, e]));
  const charName = new Map(characters.map((c) => [c.value, c.label]));
  const groupeName = new Map(groupes.map((g) => [g.value, g.label]));
  const color = versions.find((v) => v.id === versionId)?.color ?? "#8AB4FF";
  const href = (v: string, id?: string) =>
    `/admin/lore?v=${encodeURIComponent(v)}${id ? `&id=${id}` : ""}`;

  const move = (i: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [x] = next.splice(i, 1);
    next.splice(to, 0, x);
    setOrder(next);
    start(async () => {
      const r = await reorderLoreEvents(versionId, next);
      if (!r.ok) setMsg({ tone: "error", text: r.error });
      router.refresh();
    });
  };

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await saveLoreEvent(isNew ? null : selected, {
        titre: f.titre,
        resume: f.resume,
        versionId: f.versionId,
        major: f.major,
        clips: f.clips.filter((c) => c.url.trim()),
        characterIds: f.characterIds,
        groupeIds: f.groupeIds,
      });
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      router.replace(href(f.versionId, r.data.id));
      router.refresh();
    });

  const remove = () => {
    if (!confirmDelete) return setConfirmDelete(true);
    start(async () => {
      const r = await deleteLoreEvent(selected);
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      router.replace(href(versionId));
      router.refresh();
    });
  };

  const setClip = (i: number, patch: Partial<LoreClipInput>) =>
    setF({ ...f, clips: f.clips.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const moveClip = (i: number, to: number) => {
    if (to < 0 || to >= f.clips.length) return;
    const next = [...f.clips];
    const [x] = next.splice(i, 1);
    next.splice(to, 0, x);
    setF({ ...f, clips: next });
  };

  return (
    <>
      <PageHeader
        title="Lore"
        meta="Événements marquants par version. L’ordre de la liste est celui de la frise, du plus ancien au plus récent."
        actions={
          <ButtonLink href={href(versionId, "new")} variant="primary">
            + Nouvel événement
          </ButtonLink>
        }
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <div className="flex flex-wrap gap-1.5">
        {versions.map((v) => (
          <Link
            key={v.id}
            href={href(v.id)}
            aria-current={v.id === versionId ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-[13px] font-bold",
              v.id === versionId
                ? "border-transparent text-[#0B0C0F]"
                : "border-[#3A3E47] text-[#C4C7CF] hover:bg-[#1F2228]",
            )}
            style={v.id === versionId ? { background: v.color } : undefined}
          >
            {v.id}
            <span className="text-[11px] font-normal opacity-80">{v.count}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <nav
          aria-label="Événements"
          className="flex min-w-0 flex-[1_1_260px] flex-col overflow-hidden rounded-[10px] border border-[#23262D] lg:max-w-[340px]"
        >
          {order.length === 0 && !isNew && (
            <p className="px-3 py-4 text-[13px] text-[#9AA0AA]">Aucun événement dans cette version.</p>
          )}
          {order.map((id, i) => {
            const e = byId.get(id)!;
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
                    aria-label={`Monter ${e.titre}`}
                    disabled={i === 0 || pending}
                    onClick={() => move(i, i - 1)}
                    className="flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Descendre ${e.titre}`}
                    disabled={i === order.length - 1 || pending}
                    onClick={() => move(i, i + 1)}
                    className="flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </span>
                <Link
                  href={href(versionId, id)}
                  aria-current={on ? "page" : undefined}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <span className="w-5 flex-none text-center text-[12px] text-[#6E7380]">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{e.titre}</span>
                  {e.major && (
                    <span
                      className="flex-none rounded-full px-2 py-px text-[11px] font-bold text-[#0B0C0F]"
                      style={{ background: color }}
                    >
                      Majeur
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
          {isNew && (
            <div className="border-t border-[#23262D] bg-[#1A2233] px-3 py-3 font-semibold">
              Nouvel événement…
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
          <Panel legend={isNew ? "Nouvel événement" : "Événement"}>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Titre" className="sm:col-span-2">
                <TextInput
                  value={f.titre}
                  onChange={(e) => setF({ ...f, titre: e.target.value })}
                  required
                />
              </Field>
              <Field label="Résumé court" className="sm:col-span-2" hint="Deux ou trois phrases.">
                <TextArea
                  rows={4}
                  value={f.resume}
                  onChange={(e) => setF({ ...f, resume: e.target.value })}
                  required
                />
              </Field>
              <Field
                label="Version"
                hint={!isNew && f.versionId !== initial.versionId ? "Il passera en fin de la nouvelle version." : undefined}
              >
                <Select value={f.versionId} onChange={(e) => setF({ ...f, versionId: e.target.value })}>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} · {v.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <label className="flex min-h-10 items-center justify-between gap-3 self-end rounded-lg border border-[#3A3E47] bg-[#0B0C0F] px-3 text-[13px] font-semibold text-[#C4C7CF]">
                Événement majeur
                <input
                  type="checkbox"
                  checked={f.major}
                  onChange={(e) => setF({ ...f, major: e.target.checked })}
                  className="h-5 w-5 accent-[#2F6FEB]"
                />
              </label>
            </div>
          </Panel>

          <Panel legend="Clips">
            <div className="flex flex-col gap-3">
              {f.clips.length === 0 && (
                <p className="text-[13px] text-[#9AA0AA]">
                  Aucun clip. YouTube et Twitch (clips) sont lus sur la page ; les autres liens s’ouvrent dans un nouvel onglet.
                </p>
              )}
              {f.clips.map((c, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <span className="flex flex-none flex-col">
                    <button
                      type="button"
                      aria-label="Monter le clip"
                      disabled={i === 0}
                      onClick={() => moveClip(i, i - 1)}
                      className="flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Descendre le clip"
                      disabled={i === f.clips.length - 1}
                      onClick={() => moveClip(i, i + 1)}
                      className="flex h-4 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </span>
                  <TextInput
                    value={c.url}
                    onChange={(e) => setClip(i, { url: e.target.value })}
                    placeholder="https://…"
                    aria-label={`Lien du clip ${i + 1}`}
                    className="min-w-0 flex-[2_1_220px]"
                  />
                  <TextInput
                    value={c.titre ?? ""}
                    onChange={(e) => setClip(i, { titre: e.target.value })}
                    placeholder={`Clip ${i + 1}`}
                    aria-label={`Titre du clip ${i + 1}`}
                    className="min-w-0 flex-[1_1_140px]"
                  />
                  <button
                    type="button"
                    aria-label="Retirer le clip"
                    onClick={() => setF({ ...f, clips: f.clips.filter((_, j) => j !== i) })}
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[#3A3E47] text-[#9AA0AA] hover:border-[#5A2A2E] hover:text-[#FF8A8E]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div>
                <Button onClick={() => setF({ ...f, clips: [...f.clips, { url: "", titre: null }] })}>
                  + Ajouter un clip
                </Button>
              </div>
            </div>
          </Panel>

          <Panel legend="Personnages concernés">
            <Picker
              label="un personnage"
              options={characters.filter((o) => !f.characterIds.includes(o.value))}
              ids={f.characterIds}
              names={charName}
              onAdd={(id) => setF({ ...f, characterIds: [...f.characterIds, id] })}
              onRemove={(id) => setF({ ...f, characterIds: f.characterIds.filter((x) => x !== id) })}
            />
          </Panel>

          <Panel legend="Groupes concernés">
            <Picker
              label="un groupe"
              options={groupes.filter((o) => !f.groupeIds.includes(o.value))}
              ids={f.groupeIds}
              names={groupeName}
              onAdd={(id) => setF({ ...f, groupeIds: [...f.groupeIds, id] })}
              onRemove={(id) => setF({ ...f, groupeIds: f.groupeIds.filter((x) => x !== id) })}
            />
          </Panel>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "…" : isNew ? "Créer l’événement" : "Enregistrer"}
            </Button>
            {!isNew && (
              <Button variant="danger" onClick={remove} disabled={pending}>
                {confirmDelete ? "Confirmer la suppression" : "Supprimer"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

/** Choix multiple : recherche → ajoute en pastille ; la croix retire. */
function Picker({
  label,
  options,
  ids,
  names,
  onAdd,
  onRemove,
}: {
  label: string;
  options: Option[];
  ids: string[];
  names: Map<string, string>;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <SearchSelect
        key={ids.length}
        label={label}
        placeholder={`Rechercher ${label}…`}
        options={options}
        value={null}
        allowClear={false}
        onChange={(v) => v && onAdd(v)}
      />
      {ids.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1.5 rounded-full border border-[#3A3E47] bg-[#15171B] py-0.5 pl-2.5 pr-1 text-[13px]"
            >
              {names.get(id) ?? id}
              <button
                type="button"
                aria-label={`Retirer ${names.get(id) ?? id}`}
                onClick={() => onRemove(id)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-[#9AA0AA] hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
