"use client";

import ImageUpload from "@/app/_composents/admin/ImageUpload";
import { MentionTextarea } from "@/app/_composents/MentionTextarea";
import { useToast } from "@/app/_composents/toast/ToastProvider";
import { updateOwnCharacterPresentation } from "@/app/profil/actions";
import { detectSoundPlatform, PLATFORM_STYLE } from "@/lib/media-embed";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Rediffusion = { url: string; titre: string | null };
type Sound = { titre: string; artiste: string | null; url: string };

type FormState = {
  description: string;
  imageUrl: string | null;
  lienReddifs: Rediffusion[];
  sounds: Sound[];
};

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
        className="flex h-4 w-6 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
      >
        <ArrowUp className="h-3 w-3" />
      </button>
      <button
        type="button"
        aria-label={`Descendre ${label}`}
        disabled={index === length - 1}
        onClick={() => onMove(index + 1)}
        className="flex h-4 w-6 items-center justify-center text-[#9AA0AA] hover:text-white disabled:opacity-30"
      >
        <ArrowDown className="h-3 w-3" />
      </button>
    </span>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
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

/** Édition directe (sans modération) de la présentation d'un perso du joueur lié au compte. */
export default function OwnCharacterEditor({
  characterId,
  initial,
}: {
  characterId: string;
  initial: FormState;
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<FormState>(initial);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      try {
        await updateOwnCharacterPresentation(characterId, f);
        setEditing(false);
        toast({ tone: "success", title: "Fiche enregistrée" });
        router.refresh();
      } catch (err) {
        toast({
          tone: "error",
          title: "Enregistrement impossible",
          text: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setF(initial);
          setEditing(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#3A3E47] px-3.5 py-2 text-[13px] font-semibold text-[#C4C7CF] hover:border-[#6E7380] hover:text-[#ECECEE]"
      >
        <Pencil className="h-3.5 w-3.5" />
        Modifier ma présentation
      </button>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-[10px] border border-[#23262D] bg-[#15171B] p-4">
      <p className="m-0 text-[13px] text-[#9AA0AA]">
        Description, image, rediffusions et sons — modifiables en direct.
        Groupes, versions et relations passent toujours par « Proposer une
        modification ».
      </p>

      <ImageUpload
        label="image du perso"
        value={f.imageUrl}
        onChange={(v) => setF({ ...f, imageUrl: v })}
        hint="Recadrage auto sur le visage"
        preview="w_480,h_270,c_fill,g_face"
        aspect="wide"
      />

      <label className="flex flex-col gap-1">
        <span className="text-[12px] font-semibold text-[#C4C7CF]">Histoire</span>
        <MentionTextarea
          value={f.description}
          onChange={(v) => setF({ ...f, description: v })}
          characters={[]}
          placeholder="Parcours, anecdotes, circonstances de la mort…"
          className="min-h-32 w-full rounded-lg border border-[#3A3E47] bg-[#0B0C0F] px-3 py-2.5 text-[14px] leading-relaxed text-[#ECECEE]"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold text-[#C4C7CF]">
          Rediffusions (dans l&apos;ordre de visionnage)
        </span>
        {f.lienReddifs.map((r, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-[#23262D] bg-[#0B0C0F] p-2"
          >
            <OrderButtons
              index={i}
              length={f.lienReddifs.length}
              label={`le lien ${i + 1}`}
              onMove={(to) => setF({ ...f, lienReddifs: move(f.lienReddifs, i, to) })}
            />
            <input
              type="url"
              aria-label={`Lien de rediffusion ${i + 1}`}
              value={r.url}
              onChange={(e) =>
                setF({
                  ...f,
                  lienReddifs: f.lienReddifs.map((x, j) =>
                    j === i ? { ...x, url: e.target.value } : x,
                  ),
                })
              }
              placeholder="https://www.youtube.com/playlist?list=…"
              className="min-w-50 flex-[2_1_240px] min-h-9 rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 text-[13px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
            />
            <input
              aria-label={`Titre du lien ${i + 1}`}
              value={r.titre ?? ""}
              onChange={(e) =>
                setF({
                  ...f,
                  lienReddifs: f.lienReddifs.map((x, j) =>
                    j === i ? { ...x, titre: e.target.value } : x,
                  ),
                })
              }
              placeholder={`Titre (facultatif, ex. « Partie ${i + 1} »)`}
              className="min-w-35 flex-[1_1_180px] min-h-9 rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 text-[13px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
            />
            <RemoveButton
              label={`Retirer le lien ${i + 1}`}
              onClick={() =>
                setF({ ...f, lienReddifs: f.lienReddifs.filter((_, j) => j !== i) })
              }
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setF({ ...f, lienReddifs: [...f.lienReddifs, { url: "", titre: null }] })
          }
          className="flex min-h-9 w-fit items-center gap-1.5 rounded-md border border-[#3A3E47] px-3 text-[13px] font-semibold text-[#C4C7CF] hover:border-[#6E7380]"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter un lien de rediffusion
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold text-[#C4C7CF]">Sons du perso</span>
        {f.sounds.map((s, i) => {
          const pf = PLATFORM_STYLE[detectSoundPlatform(s.url)];
          return (
            <div
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-[#23262D] bg-[#0B0C0F] p-2"
            >
              <OrderButtons
                index={i}
                length={f.sounds.length}
                label={s.titre || "ce son"}
                onMove={(to) => setF({ ...f, sounds: move(f.sounds, i, to) })}
              />
              <input
                aria-label="Lien du son"
                type="url"
                placeholder="Lien YouTube, SoundCloud, Spotify…"
                value={s.url}
                onChange={(e) =>
                  setF({
                    ...f,
                    sounds: f.sounds.map((x, j) =>
                      j === i ? { ...x, url: e.target.value } : x,
                    ),
                  })
                }
                className="min-w-50 flex-[2_1_240px] min-h-9 rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 text-[13px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
              />
              <input
                aria-label="Titre"
                placeholder="Titre"
                value={s.titre}
                onChange={(e) =>
                  setF({
                    ...f,
                    sounds: f.sounds.map((x, j) =>
                      j === i ? { ...x, titre: e.target.value } : x,
                    ),
                  })
                }
                className="min-w-35 flex-[1_1_160px] min-h-9 rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 text-[13px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
              />
              <input
                aria-label="Artiste"
                placeholder="Artiste"
                value={s.artiste ?? ""}
                onChange={(e) =>
                  setF({
                    ...f,
                    sounds: f.sounds.map((x, j) =>
                      j === i ? { ...x, artiste: e.target.value } : x,
                    ),
                  })
                }
                className="min-w-30 flex-[1_1_140px] min-h-9 rounded-md border border-[#3A3E47] bg-[#0E0F12] px-3 text-[13px] text-[#ECECEE] outline-none focus:border-[#2F6FEB]"
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
                onClick={() => setF({ ...f, sounds: f.sounds.filter((_, j) => j !== i) })}
              />
            </div>
          );
        })}
        <button
          type="button"
          onClick={() =>
            setF({
              ...f,
              sounds: [...f.sounds, { titre: "", artiste: null, url: "" }],
            })
          }
          className="flex min-h-9 w-fit items-center gap-1.5 rounded-md border border-[#3A3E47] px-3 text-[13px] font-semibold text-[#C4C7CF] hover:border-[#6E7380]"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter un son
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex min-h-11 items-center gap-1.5 rounded-md bg-[#2F6FEB] px-4 text-[14px] font-bold text-white hover:bg-[#2F6FEB]/90 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          {pending ? "…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => {
            setF(initial);
            setEditing(false);
          }}
          className="flex min-h-11 items-center rounded-md border border-[#3A3E47] px-3.5 text-[14px] font-bold text-[#C4C7CF] hover:border-[#6E7380]"
        >
          Annuler
        </button>
      </div>
    </section>
  );
}
