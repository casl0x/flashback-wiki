"use client";

import {
  Button,
  ButtonLink,
  ETAT_COLORS,
  ETAT_LABELS,
  Field,
  Notice,
  PageHeader,
  Panel,
  Select,
  TextInput,
} from "@/app/_composents/admin/ui";
import ImageUpload from "@/app/_composents/admin/ImageUpload";
import { BADGES_CONFIG } from "@/app/_composents/admin/PlayerBadges";
import {
  deletePlayer,
  fetchTwitchAvatar,
  savePlayer,
  unlinkPlayerAccount,
} from "@/lib/admin/actions/players";
import { cloudinaryUrl, initials } from "@/lib/cloudinary";
import { RESEAUX_OPTIONS } from "@/lib/reseaux";
import { detectStreamPlatform, extractStreamUsername } from "@/lib/utils";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type P = {
  id: string | null;
  pseudo: string;
  badges: string[];
  chaines: string[];
  reseaux: Record<string, string>;
  imageUrl: string | null;
};
type C = {
  id: string;
  nom: string;
  imageUrl: string | null;
  etatVie: keyof typeof ETAT_LABELS;
  versions: { id: string; color: string }[];
  job: string | null;
};

const PLAT = {
  twitch: { label: "Twitch", bg: "#9146FF", fg: "#FFFFFF" },
  kick: { label: "Kick", bg: "#53FC18", fg: "#0E0F12" },
};

export default function PlayerEditor({
  initial,
  backHref,
  account,
  characters,
}: {
  initial: P;
  backHref: string;
  account: string | null;
  characters: C[];
}) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newReseau, setNewReseau] = useState<string>("");
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);
  const [fetchingAvatar, setFetchingAvatar] = useState<string | null>(null);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  const plat = detectStreamPlatform(f.chaines[0] ?? null);
  const unusedReseaux = RESEAUX_OPTIONS.filter((r) => !(r.key in f.reseaux));
  const twitchChaines = f.chaines.filter((c) => detectStreamPlatform(c) === "twitch");

  async function applyTwitchAvatar(url: string) {
    setAvatarMsg(null);
    setFetchingAvatar(url);
    const r = await fetchTwitchAvatar(url);
    setFetchingAvatar(null);
    if (!r.ok) return setAvatarMsg(r.error);
    setF((s) => ({ ...s, imageUrl: r.data.avatarUrl }));
  }

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await savePlayer(f.id, f);
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      router.push(backHref);
      router.refresh();
    });

  const remove = () => {
    if (!f.id) return;
    if (!confirmDelete) return setConfirmDelete(true);
    start(async () => {
      const r = await deletePlayer(f.id!);
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      router.push(backHref);
      router.refresh();
    });
  };

  const unlink = () =>
    start(async () => {
      const r = await unlinkPlayerAccount(f.id!);
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      router.refresh();
    });

  return (
    <>
      <PageHeader
        back={{ href: backHref, label: "Joueurs" }}
        title={f.pseudo || "Nouveau joueur"}
        meta={
          f.id
            ? `${characters.length} personnage${characters.length > 1 ? "s" : ""}`
            : "Pas encore enregistré"
        }
        actions={
          <Button variant="primary" disabled={pending || !dirty} onClick={save}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
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
          <Panel legend="Joueur">
            <div className="flex flex-col gap-3.5">
              <Field label="Pseudo">
                <TextInput
                  value={f.pseudo}
                  onChange={(e) => setF({ ...f, pseudo: e.target.value })}
                  required
                />
              </Field>
              <div className="flex flex-col gap-1.5">
                <span
                  id="pbadges"
                  className="text-[13px] font-semibold text-[#C4C7CF]"
                >
                  Badges
                </span>
                <div
                  role="group"
                  aria-labelledby="pbadges"
                  className="flex flex-wrap gap-2"
                >
                  {BADGES_CONFIG.map((b) => {
                    const on = f.badges.includes(b.key);
                    const Icon = b.icon;
                    return (
                      <button
                        key={b.key}
                        type="button"
                        aria-pressed={on}
                        title={b.description}
                        onClick={() =>
                          setF({
                            ...f,
                            badges: on
                              ? f.badges.filter((x) => x !== b.key)
                              : [...f.badges, b.key],
                          })
                        }
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold"
                        style={
                          on
                            ? {
                                borderColor: b.color,
                                background: `${b.color}26`,
                                color: "#ECECEE",
                              }
                            : { borderColor: "#3A3E47", color: "#9AA0AA" }
                        }
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {b.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[12px] text-[#9AA0AA]">
                  « Streamer actif » active le suivi du live sur le lien de la
                  chaîne.
                </span>
              </div>
            </div>
          </Panel>

          <Panel legend="Stream">
            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-[#9AA0AA]">
                La plateforme de chaque lien est déduite automatiquement
                (twitch.tv ou kick.com).
              </span>
              {f.chaines.map((url, i) => {
                const chainPlat = detectStreamPlatform(url);
                return (
                  <div key={i} className="flex items-center gap-2">
                    {chainPlat && (
                      <span
                        className="flex-none rounded px-2 py-0.5 text-[11px] font-extrabold"
                        style={{
                          background: PLAT[chainPlat].bg,
                          color: PLAT[chainPlat].fg,
                        }}
                      >
                        {PLAT[chainPlat].label}
                      </span>
                    )}
                    <TextInput
                      type="url"
                      aria-label={`Lien de la chaîne ${i + 1}`}
                      value={url}
                      onChange={(e) =>
                        setF({
                          ...f,
                          chaines: f.chaines.map((c, j) =>
                            j === i ? e.target.value : c,
                          ),
                        })
                      }
                      placeholder="https://www.twitch.tv/pseudo"
                    />
                    <button
                      type="button"
                      aria-label={`Retirer la chaîne ${i + 1}`}
                      onClick={() =>
                        setF({
                          ...f,
                          chaines: f.chaines.filter((_, j) => j !== i),
                        })
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
                onClick={() => setF({ ...f, chaines: [...f.chaines, ""] })}
              >
                + Ajouter une chaîne
              </Button>
            </div>
          </Panel>

          <Panel legend="Réseaux">
            <div className="flex flex-col gap-2">
              {Object.entries(f.reseaux).map(([key, url]) => {
                const opt = RESEAUX_OPTIONS.find((r) => r.key === key);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span
                      className="w-25 flex-none text-[13px] font-semibold"
                      style={{ color: opt?.color }}
                    >
                      {opt?.label ?? key}
                    </span>
                    <TextInput
                      type="url"
                      aria-label={opt?.label ?? key}
                      value={url}
                      onChange={(e) =>
                        setF({
                          ...f,
                          reseaux: { ...f.reseaux, [key]: e.target.value },
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Retirer ${opt?.label ?? key}`}
                      onClick={() => {
                        const next = { ...f.reseaux };
                        delete next[key];
                        setF({ ...f, reseaux: next });
                      }}
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-[#2C3038] text-[#A3A8B3] hover:text-[#FF8A8E]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              {unusedReseaux.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    aria-label="Réseau à ajouter"
                    value={newReseau}
                    onChange={(e) => setNewReseau(e.target.value)}
                    className="w-auto"
                  >
                    <option value="">Choisir…</option>
                    {unusedReseaux.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                  <Button
                    disabled={!newReseau}
                    onClick={() => {
                      setF({
                        ...f,
                        reseaux: { ...f.reseaux, [newReseau]: "" },
                      });
                      setNewReseau("");
                    }}
                  >
                    + Ajouter un réseau
                  </Button>
                </div>
              )}
            </div>
          </Panel>

          {f.id && (
            <Panel legend={`Personnages · ${characters.length}`}>
              <div className="flex flex-col gap-2">
                {characters.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border border-[#23262D] bg-[#0B0C0F] px-3 py-2"
                  >
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cloudinaryUrl(
                          c.imageUrl,
                          "w_64,h_64,c_fill,g_face",
                        )}
                        alt=""
                        className="h-9 w-9 flex-none rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#2B2E35] text-[11px] font-bold"
                      >
                        {initials(c.nom)}
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{c.nom}</span>
                      <span className="text-[12px] text-[#9AA0AA]">
                        {c.job ?? "—"} ·{" "}
                        <span style={{ color: ETAT_COLORS[c.etatVie] }}>
                          {ETAT_LABELS[c.etatVie]}
                        </span>
                      </span>
                    </span>
                    <span className="hidden flex-wrap gap-1 sm:flex">
                      {c.versions.map((v) => (
                        <span
                          key={v.id}
                          className="rounded px-1.5 py-px text-[11px] font-bold text-[#121212]"
                          style={{ background: v.color }}
                        >
                          {v.id}
                        </span>
                      ))}
                    </span>
                    <Link
                      href={`/admin/characters/${c.id}?back=${encodeURIComponent(`/admin/players/${f.id}`)}`}
                      className="inline-flex min-h-8 items-center rounded-md border border-[#3A3E47] px-2.5 text-[13px] hover:bg-[#1F2228]"
                    >
                      Modifier
                    </Link>
                  </div>
                ))}
                <ButtonLink
                  href={`/admin/characters/new?player=${f.id}&back=${encodeURIComponent(`/admin/players/${f.id}`)}`}
                  className="self-start"
                >
                  + Créer un perso pour {f.pseudo}
                </ButtonLink>
              </div>
            </Panel>
          )}

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
                  ? "Confirmer (les persos restent, sans joueur)"
                  : "Supprimer le joueur"}
              </Button>
            )}
          </div>
        </form>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <Panel legend="Avatar">
            <div className="flex flex-col gap-3">
              <ImageUpload
                label="avatar du joueur"
                value={f.imageUrl}
                onChange={(v) => setF({ ...f, imageUrl: v })}
                hint="Recadrage auto sur le visage"
                preview="w_200,h_200,c_fill,g_face"
                aspect="square"
              />
              {twitchChaines.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {twitchChaines.map((url) => (
                    <Button
                      key={url}
                      disabled={fetchingAvatar === url}
                      onClick={() => applyTwitchAvatar(url)}
                    >
                      {fetchingAvatar === url
                        ? "…"
                        : `Utiliser la pp Twitch (${extractStreamUsername(url)})`}
                    </Button>
                  ))}
                </div>
              )}
              {avatarMsg && (
                <span className="text-[12px] text-[#FF8A8E]">{avatarMsg}</span>
              )}
              {!f.imageUrl && (
                <span className="text-[12px] text-[#9AA0AA]">
                  Sans image : initiales du pseudo, et la bannière de la page
                  joueur est générée avec les photos de ses persos.
                </span>
              )}
            </div>
          </Panel>
          {f.id && (
            <Panel legend="Compte lié">
              {account ? (
                <div className="flex flex-col gap-2.5">
                  <span className="font-semibold">{account}</span>
                  <span className="text-[12px] text-[#9AA0AA]">
                    Ce compte peut voir et proposer des modifs sur ses persos.
                  </span>
                  <Button
                    variant="danger"
                    className="self-start"
                    disabled={pending}
                    onClick={unlink}
                  >
                    Délier
                  </Button>
                </div>
              ) : (
                <p className="m-0 text-[13px] text-[#9AA0AA]">
                  Aucun compte lié. Les demandes de lien arrivent dans
                  Modération.
                </p>
              )}
            </Panel>
          )}
          <Panel legend="Aperçu dans la liste">
            <div className="flex min-h-18 items-center gap-3 rounded-[10px] border border-[#23262D] bg-[#0B0C0F] p-3">
              <span
                className="relative flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-[#2B2E35] font-bold"
                style={{
                  boxShadow: `0 0 0 2px ${plat ? PLAT[plat].bg : "#3A3E47"}`,
                }}
              >
                {f.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cloudinaryUrl(f.imageUrl, "w_96,h_96,c_fill,g_face")}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  initials(f.pseudo || "?")
                )}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-bold">{f.pseudo || "Pseudo"}</span>
                <span className="text-[12px] text-[#9AA0AA]">
                  {characters.length} persos
                </span>
              </span>
              {plat && (
                <span
                  className="rounded px-2 py-0.5 text-[11px] font-extrabold"
                  style={{ background: PLAT[plat].bg, color: PLAT[plat].fg }}
                >
                  {PLAT[plat].label}
                </span>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
