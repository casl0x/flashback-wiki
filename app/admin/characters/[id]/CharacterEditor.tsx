"use client";

import ImageUpload from "@/app/_composents/admin/ImageUpload";
import SearchSelect from "@/app/_composents/admin/SearchSelect";
import {
  Button,
  ButtonLink,
  ETAT_LABELS,
  Field,
  Notice,
  PageHeader,
  Panel,
  Select,
  TextInput,
} from "@/app/_composents/admin/ui";
import { MentionTextarea } from "@/app/_composents/MentionTextarea";
import {
  deleteCharacter,
  fetchSoundMeta,
  saveCharacter,
  saveCharacterLocation,
  type CharacterInput,
} from "@/lib/admin/actions/characters";
import { savePlayer } from "@/lib/admin/actions/players";
import { shortDate } from "@/lib/admin/format";
import { cloudinaryUrl, initials } from "@/lib/cloudinary";
import type { Character } from "@/lib/db";
import { PLATFORM_STYLE, detectSoundPlatform } from "@/lib/media-embed";
import { relationKind } from "@/lib/relation-kinds";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const AdminLocationPicker = dynamic(
  () => import("@/app/_composents/admin/AdminLocationPicker"),
  { ssr: false },
);

type EtatVie = keyof typeof ETAT_LABELS;

export type EditorCharacter = {
  id: string | null;
  nom: string;
  role: "civil" | "illegal" | null;
  metier: string;
  etatVie: EtatVie;
  description: string;
  lienReddif: string;
  imageUrl: string | null;
  playerId: string | null;
  versionIds: string[];
  locationX: number | null;
  locationY: number | null;
  createdAt: string | null;
  memberships: {
    key: string;
    groupeId: string;
    versionId: string | null;
    gradeId: string | null;
    matricule: string;
  }[];
  sounds: { key: string; titre: string; artiste: string; url: string }[];
  relations: { key: string; otherId: string; type: string; inverse: string }[];
};

type Props = {
  initial: EditorCharacter;
  backHref: string;
  players: { id: string; pseudo: string }[];
  versions: { id: string; label: string; color: string }[];
  groupes: {
    id: string;
    nom: string;
    color: string | null;
    grades: { id: string; nom: string }[];
  }[];
  characters: { id: string; nom: string; pseudo: string | null }[];
};

// Suggestions pour les libellés de relation (le champ reste libre).
const RELATION_TYPES = [
  "Père",
  "Mère",
  "Fils",
  "Fille",
  "Frère",
  "Sœur",
  "Demi-frère",
  "Demi-sœur",
  "Grand-père",
  "Grand-mère",
  "Petit-fils",
  "Petite-fille",
  "Oncle",
  "Tante",
  "Neveu",
  "Nièce",
  "Cousin",
  "Cousine",
  "Mari",
  "Femme",
  "En couple avec",
  "Ex",
  "Fiancé",
  "Fiancée",
  "Meilleur ami",
  "Meilleure amie",
  "Ami",
  "Amie",
  "Ennemi",
  "Ennemie",
  "Collègue",
  "Patron",
  "Employé",
];

const KIND_LABEL: Record<string, string> = {
  parent: "Parents",
  fratrie: "Fratrie",
  enfant: "Enfants",
  couple: "Cœur",
  marie: "Cœur",
  ex: "Cœur",
  "grand-parent": "Famille élargie",
  "oncle-tante": "Famille élargie",
  cousin: "Famille élargie",
  "neveu-niece": "Famille élargie",
  "petit-enfant": "Famille élargie",
  autre: "Autres liens",
};

let seq = 0;
const newKey = () => `new-${++seq}`;

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

function OrderButtons({
  index,
  length,
  onMove,
  label,
}: {
  index: number;
  length: number;
  onMove: (to: number) => void;
  label: string;
}) {
  return (
    <span className="flex flex-none flex-col">
      <button
        type="button"
        aria-label={`Monter ${label}`}
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        className="flex h-4.25 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label={`Descendre ${label}`}
        disabled={index === length - 1}
        onClick={() => onMove(index + 1)}
        className="flex h-4.25 w-7 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[#2C3038] text-[#A3A8B3] hover:border-[#5A2A2E] hover:text-[#FF8A8E]"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export default function CharacterEditor({
  initial,
  backHref,
  players: initialPlayers,
  versions,
  groupes,
  characters,
}: Props) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [players, setPlayers] = useState(initialPlayers);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof EditorCharacter>(k: K, v: EditorCharacter[K]) =>
    setF((s) => ({ ...s, [k]: v }));
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);

  const groupeById = useMemo(
    () => new Map(groupes.map((g) => [g.id, g])),
    [groupes],
  );
  const versionById = useMemo(
    () => new Map(versions.map((v) => [v.id, v])),
    [versions],
  );
  const charOptions = useMemo(
    () =>
      characters
        .filter((c) => c.id !== f.id)
        .map((c) => ({ value: c.id, label: c.nom, hint: c.pseudo })),
    [characters, f.id],
  );
  const mentionChars = useMemo(
    () =>
      characters.map((c) => ({
        id: c.id,
        nom: c.nom,
        player: c.pseudo ? { pseudo: c.pseudo } : null,
      })) as unknown as Character[],
    [characters],
  );
  const firstName = f.nom.trim().split(/\s+/)[0] || "ce perso";
  const current = f.memberships.at(-1);
  const currentGroupe = current ? groupeById.get(current.groupeId) : null;
  const currentGrade =
    current && currentGroupe
      ? currentGroupe.grades.find((g) => g.id === current.gradeId)
      : null;

  function save() {
    setMsg(null);
    const input: CharacterInput = {
      nom: f.nom,
      role: f.role,
      metier: f.metier,
      etatVie: f.etatVie,
      description: f.description,
      lienReddif: f.lienReddif,
      imageUrl: f.imageUrl,
      playerId: f.playerId,
      versionIds: f.versionIds,
      memberships: f.memberships.map((m) => ({
        groupeId: m.groupeId,
        versionId: m.versionId,
        gradeId: m.gradeId,
        matricule: m.matricule,
      })),
      sounds: f.sounds.map((s) => ({
        titre: s.titre,
        artiste: s.artiste,
        url: s.url,
      })),
      relations: f.relations.map((r) => ({
        otherId: r.otherId,
        type: r.type,
        inverse: r.inverse,
      })),
    };
    start(async () => {
      const r = await saveCharacter(f.id, input);
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      router.push(backHref);
      router.refresh();
    });
  }

  function remove() {
    if (!f.id) return;
    if (!confirmDelete) return setConfirmDelete(true);
    start(async () => {
      const r = await deleteCharacter(f.id!);
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      router.push(backHref);
      router.refresh();
    });
  }

  async function createPlayer(pseudo: string) {
    const r = await savePlayer(null, {
      pseudo,
      badges: [],
      lienChaine: null,
      reseaux: {},
    });
    if (!r.ok) return setMsg({ tone: "error", text: r.error });
    setPlayers((p) =>
      [...p, { id: r.data.id, pseudo }].sort((a, b) =>
        a.pseudo.localeCompare(b.pseudo),
      ),
    );
    set("playerId", r.data.id);
  }

  async function fillSoundMeta(key: string, url: string) {
    const s = f.sounds.find((x) => x.key === key);
    if (!url.trim() || (s && s.titre && s.artiste)) return;
    const meta = await fetchSoundMeta(url);
    setF((st) => ({
      ...st,
      sounds: st.sounds.map((x) =>
        x.key === key
          ? {
              ...x,
              titre: x.titre || meta.titre || "",
              artiste: x.artiste || meta.artiste || "",
            }
          : x,
      ),
    }));
  }

  const actions = (
    <>
      {f.id && (
        <ButtonLink href={`/personnages/${f.id}`} target="_blank">
          Voir sur le site ↗
        </ButtonLink>
      )}
      <Button variant="primary" disabled={pending || !dirty} onClick={save}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </>
  );

  return (
    <>
      <PageHeader
        back={{ href: backHref, label: "Personnages" }}
        title={f.nom || "Nouveau personnage"}
        meta={
          f.createdAt
            ? `Créé le ${shortDate(f.createdAt)}`
            : "Pas encore enregistré"
        }
        actions={actions}
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
          {/* Identité */}
          <Panel legend="Identité">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Nom complet">
                <TextInput
                  value={f.nom}
                  onChange={(e) => set("nom", e.target.value)}
                  required
                />
              </Field>
              <Field label="Joueur">
                <SearchSelect
                  label="Joueur"
                  options={players.map((p) => ({
                    value: p.id,
                    label: p.pseudo,
                  }))}
                  value={f.playerId}
                  onChange={(v) => set("playerId", v)}
                  placeholder="Choisir un joueur…"
                  onCreate={createPlayer}
                  createLabel={(t) => `+ Créer le joueur « ${t} »`}
                />
              </Field>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span
                  id="cversions"
                  className="text-[13px] font-semibold text-[#C4C7CF]"
                >
                  Versions
                </span>
                <div
                  role="group"
                  aria-labelledby="cversions"
                  className="flex flex-wrap gap-2"
                >
                  {versions.map((v) => {
                    const on = f.versionIds.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        aria-pressed={on}
                        title={v.label}
                        onClick={() =>
                          set(
                            "versionIds",
                            on
                              ? f.versionIds.filter((x) => x !== v.id)
                              : [...f.versionIds, v.id],
                          )
                        }
                        className="min-h-9 rounded-full border px-3.5 text-[13px] font-bold"
                        style={
                          on
                            ? {
                                background: v.color,
                                borderColor: v.color,
                                color: "#121212",
                              }
                            : { borderColor: "#3A3E47", color: "#C4C7CF" }
                        }
                      >
                        {v.id}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[12px] text-[#9AA0AA]">
                  Coche toutes les versions où le perso apparaît.
                </span>
              </div>
              <Field label="Rôle">
                <Select
                  value={f.role ?? ""}
                  onChange={(e) =>
                    set(
                      "role",
                      (e.target.value || null) as EditorCharacter["role"],
                    )
                  }
                >
                  <option value="">—</option>
                  <option value="civil">Civil</option>
                  <option value="illegal">Illégal</option>
                </Select>
              </Field>
              <Field label="Métier">
                <TextInput
                  value={f.metier}
                  onChange={(e) => set("metier", e.target.value)}
                />
              </Field>
              <Field label="État">
                <Select
                  value={f.etatVie}
                  onChange={(e) => set("etatVie", e.target.value as EtatVie)}
                >
                  {Object.entries(ETAT_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Panel>

          {/* Groupes par version */}
          <Panel
            legend="Groupes"
            aside={
              <span className="text-[12px] text-[#9AA0AA]">
                Par version, dans l’ordre chronologique ; le dernier est
                l’actuel
              </span>
            }
          >
            <div className="flex flex-col gap-2">
              {f.memberships.length === 0 && (
                <p className="m-0 text-[13px] text-[#9AA0AA]">Aucun groupe.</p>
              )}
              {f.memberships.map((m, i) => {
                const g = groupeById.get(m.groupeId);
                const last = i === f.memberships.length - 1;
                const update = (patch: Partial<typeof m>) =>
                  set(
                    "memberships",
                    f.memberships.map((x) =>
                      x.key === m.key ? { ...x, ...patch } : x,
                    ),
                  );
                return (
                  <div
                    key={m.key}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-[#23262D] bg-[#0B0C0F] p-2"
                  >
                    <OrderButtons
                      index={i}
                      length={f.memberships.length}
                      label={g?.nom ?? "ce groupe"}
                      onMove={(to) =>
                        set("memberships", move(f.memberships, i, to))
                      }
                    />
                    <Select
                      aria-label="Version"
                      value={m.versionId ?? ""}
                      onChange={(e) =>
                        update({ versionId: e.target.value || null })
                      }
                      className="w-23 flex-none font-bold"
                      style={{
                        color: m.versionId
                          ? versionById.get(m.versionId)?.color
                          : undefined,
                      }}
                    >
                      <option value="">—</option>
                      {versions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.id}
                        </option>
                      ))}
                    </Select>
                    <SearchSelect
                      label="Groupe"
                      className="min-w-40 flex-[1_1_180px]"
                      options={groupes.map((x) => ({
                        value: x.id,
                        label: x.nom,
                      }))}
                      value={m.groupeId || null}
                      allowClear={false}
                      onChange={(v) =>
                        update({ groupeId: v ?? "", gradeId: null })
                      }
                      placeholder="Groupe…"
                    />
                    <Select
                      aria-label="Grade"
                      value={m.gradeId ?? ""}
                      onChange={(e) =>
                        update({ gradeId: e.target.value || null })
                      }
                      className="w-37.5 flex-none"
                      disabled={!g || g.grades.length === 0}
                    >
                      <option value="">
                        {g && g.grades.length === 0 ? "Aucun grade" : "—"}
                      </option>
                      {g?.grades.map((gr) => (
                        <option key={gr.id} value={gr.id}>
                          {gr.nom}
                        </option>
                      ))}
                    </Select>
                    <TextInput
                      aria-label="Matricule"
                      placeholder="Matricule"
                      value={m.matricule}
                      onChange={(e) => update({ matricule: e.target.value })}
                      className="w-24 flex-none"
                    />
                    {last && (
                      <span className="rounded-full bg-[#11281C] px-2 py-px text-[11px] font-bold text-[#6EE7A0]">
                        actuel
                      </span>
                    )}
                    <RemoveButton
                      label={`Retirer ${g?.nom ?? "ce groupe"}`}
                      onClick={() =>
                        set(
                          "memberships",
                          f.memberships.filter((x) => x.key !== m.key),
                        )
                      }
                    />
                  </div>
                );
              })}
              <Button
                className="self-start"
                onClick={() =>
                  set("memberships", [
                    ...f.memberships,
                    {
                      key: newKey(),
                      groupeId: "",
                      versionId: f.versionIds.at(-1) ?? null,
                      gradeId: null,
                      matricule: "",
                    },
                  ])
                }
              >
                + Ajouter un groupe
              </Button>
              <span className="text-[12px] text-[#9AA0AA]">
                Les grades proposés sont ceux définis dans la fiche du groupe.
              </span>
            </div>
          </Panel>

          {/* Description */}
          <Panel legend="Description">
            <MentionTextarea
              value={f.description}
              onChange={(v) => set("description", v)}
              characters={mentionChars}
              placeholder="Parcours, anecdotes, circonstances de la mort… Tape @ pour lier un perso."
              className="min-h-36 w-full rounded-lg border border-[#3A3E47] bg-[#0B0C0F] px-3 py-2.5 text-[14px] leading-relaxed text-[#ECECEE]"
            />
          </Panel>

          {/* Relations */}
          <Panel legend="Relations">
            <datalist id="relation-types">
              {RELATION_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <div className="flex flex-col gap-2">
              {f.relations.length === 0 && (
                <p className="m-0 text-[13px] text-[#9AA0AA]">
                  Aucune relation.
                </p>
              )}
              {f.relations.map((r) => {
                const update = (patch: Partial<typeof r>) =>
                  set(
                    "relations",
                    f.relations.map((x) =>
                      x.key === r.key ? { ...x, ...patch } : x,
                    ),
                  );
                const other = characters.find((c) => c.id === r.otherId);
                return (
                  <div
                    key={r.key}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-[#23262D] bg-[#0B0C0F] p-2"
                  >
                    <SearchSelect
                      label="Perso lié"
                      className="min-w-45 flex-[1_1_200px]"
                      options={charOptions}
                      value={r.otherId || null}
                      allowClear={false}
                      onChange={(v) => update({ otherId: v ?? "" })}
                      placeholder="Perso…"
                    />
                    <label className="flex flex-[1_1_150px] flex-col gap-0.5 text-[11px] text-[#9AA0AA]">
                      Pour {firstName},{" "}
                      {other ? other.nom.split(/\s+/)[0] : "il/elle"} est…
                      <TextInput
                        list="relation-types"
                        value={r.type}
                        onChange={(e) => update({ type: e.target.value })}
                        placeholder="Père, Ex…"
                      />
                    </label>
                    <label className="flex flex-[1_1_150px] flex-col gap-0.5 text-[11px] text-[#9AA0AA]">
                      … et {firstName} est pour lui/elle
                      <TextInput
                        list="relation-types"
                        value={r.inverse}
                        onChange={(e) => update({ inverse: e.target.value })}
                        placeholder="Fille, Ex…"
                      />
                    </label>
                    <span className="w-27.5 flex-none text-[11px] text-[#9AA0AA]">
                      {r.type ? `→ ${KIND_LABEL[relationKind(r.type)]}` : ""}
                    </span>
                    <RemoveButton
                      label={`Retirer la relation${other ? ` avec ${other.nom}` : ""}`}
                      onClick={() =>
                        set(
                          "relations",
                          f.relations.filter((x) => x.key !== r.key),
                        )
                      }
                    />
                  </div>
                );
              })}
              <Button
                className="self-start"
                onClick={() =>
                  set("relations", [
                    ...f.relations,
                    { key: newKey(), otherId: "", type: "", inverse: "" },
                  ])
                }
              >
                + Ajouter une relation
              </Button>
              <span className="text-[12px] text-[#9AA0AA]">
                Le libellé place le perso dans l’arbre de la fiche (parents,
                fratrie, cœur) ou dans « Famille élargie ».
              </span>
            </div>
          </Panel>

          {/* Médias */}
          <Panel legend="Médias">
            <div className="flex flex-col gap-4">
              <Field label="Rediffusions (playlist YouTube)">
                <TextInput
                  type="url"
                  value={f.lienReddif}
                  onChange={(e) => set("lienReddif", e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=…"
                />
              </Field>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-[#C4C7CF]">
                  Sons du perso
                </span>
                {f.sounds.map((s, i) => {
                  const update = (patch: Partial<typeof s>) =>
                    set(
                      "sounds",
                      f.sounds.map((x) =>
                        x.key === s.key ? { ...x, ...patch } : x,
                      ),
                    );
                  const pf = PLATFORM_STYLE[detectSoundPlatform(s.url)];
                  return (
                    <div
                      key={s.key}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-[#23262D] bg-[#0B0C0F] p-2"
                    >
                      <OrderButtons
                        index={i}
                        length={f.sounds.length}
                        label={s.titre || "ce son"}
                        onMove={(to) => set("sounds", move(f.sounds, i, to))}
                      />
                      <TextInput
                        aria-label="Lien du son"
                        type="url"
                        placeholder="Lien YouTube, SoundCloud, Spotify…"
                        value={s.url}
                        onChange={(e) => update({ url: e.target.value })}
                        onBlur={(e) => fillSoundMeta(s.key, e.target.value)}
                        className="min-w-50 flex-[2_1_240px]"
                      />
                      <TextInput
                        aria-label="Titre"
                        placeholder="Titre"
                        value={s.titre}
                        onChange={(e) => update({ titre: e.target.value })}
                        className="min-w-35 flex-[1_1_160px]"
                      />
                      <TextInput
                        aria-label="Artiste"
                        placeholder="Artiste"
                        value={s.artiste}
                        onChange={(e) => update({ artiste: e.target.value })}
                        className="min-w-30 flex-[1_1_140px]"
                      />
                      {s.url && (
                        <span
                          className="flex-none rounded px-2 py-0.5 text-[11px] font-extrabold"
                          style={{ background: pf.bg, color: pf.fg }}
                        >
                          {pf.label}
                        </span>
                      )}
                      <RemoveButton
                        label={`Retirer ${s.titre || "ce son"}`}
                        onClick={() =>
                          set(
                            "sounds",
                            f.sounds.filter((x) => x.key !== s.key),
                          )
                        }
                      />
                    </div>
                  );
                })}
                <Button
                  className="self-start"
                  onClick={() =>
                    set("sounds", [
                      ...f.sounds,
                      { key: newKey(), titre: "", artiste: "", url: "" },
                    ])
                  }
                >
                  + Ajouter un son
                </Button>
                <span className="text-[12px] text-[#9AA0AA]">
                  Colle le lien : le titre et l’artiste sont récupérés
                  automatiquement quand c’est possible.
                </span>
              </div>
            </div>
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
              <Button
                variant="danger"
                className="ml-auto"
                disabled={pending}
                onClick={remove}
              >
                {confirmDelete
                  ? "Confirmer la suppression"
                  : "Supprimer la fiche"}
              </Button>
            )}
          </div>
        </form>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <Panel legend="Image">
            <ImageUpload
              label="image du perso"
              value={f.imageUrl}
              onChange={(v) => set("imageUrl", v)}
              hint="Recadrage auto sur le visage"
              preview="w_600,h_800,c_fill,g_face"
              aspect="portrait"
            />
          </Panel>

          <Panel legend="Lieu sur la carte">
            {f.id ? (
              <AdminLocationPicker
                characterId={f.id}
                characterName={f.nom}
                initialX={f.locationX}
                initialY={f.locationY}
                imageUrl={f.imageUrl}
                onSave={async (x, y) => {
                  const r = await saveCharacterLocation(f.id!, x, y);
                  if (!r.ok) throw new Error(r.error);
                }}
                onClear={async () => {
                  const r = await saveCharacterLocation(f.id!, null, null);
                  if (!r.ok) throw new Error(r.error);
                }}
              />
            ) : (
              <p className="m-0 text-[13px] text-[#9AA0AA]">
                Enregistre la fiche pour placer le perso sur la carte.
              </p>
            )}
          </Panel>

          <Panel legend="Aperçu dans la liste">
            <div
              className={cn(
                "relative flex h-62.5 w-45 flex-col justify-end overflow-hidden rounded-[10px] border border-[#23262D]",
                f.etatVie === "MORT" ? "bg-[#141416]" : "bg-[#1A1C21]",
              )}
            >
              {f.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cloudinaryUrl(f.imageUrl, "w_360,h_500,c_fill,g_face")}
                  alt=""
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover",
                    f.etatVie === "MORT" && "grayscale",
                  )}
                />
              ) : (
                <span className="absolute inset-x-0 top-23.75 text-center text-[28px] font-bold text-[#3A3E47]">
                  {initials(f.nom || "?")}
                </span>
              )}
              <span className="absolute left-2.5 right-2.5 top-2.5 flex flex-wrap gap-1">
                {f.versionIds.map((v) => (
                  <span
                    key={v}
                    className="rounded px-1.5 py-px text-[11px] font-bold text-[#121212]"
                    style={{ background: versionById.get(v)?.color }}
                  >
                    {v}
                  </span>
                ))}
              </span>
              <span className="relative flex flex-col bg-linear-to-t from-[#0E0F12] from-45% to-transparent p-3">
                <span className="text-[17px] font-bold uppercase leading-tight">
                  {f.nom || "Nom"}
                </span>
                <span className="text-[12px] text-[#C4C7CF]">
                  {currentGroupe
                    ? [currentGrade?.nom, currentGroupe.nom]
                        .filter(Boolean)
                        .join(" · ")
                    : f.metier || "—"}
                </span>
              </span>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
