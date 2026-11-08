"use client";

import SearchSelect from "@/app/_composents/admin/SearchSelect";
import { Button, Field, Notice, TextInput } from "@/app/_composents/admin/ui";
import { addPoints } from "@/lib/admin/actions/points";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

const PRESETS = [
  { label: "Photo +5", points: 5, reason: "Photo envoyée sur Discord" },
  { label: "Info +10", points: 10, reason: "Information envoyée sur Discord" },
];

type Props = {
  userProfileId: string;
  name: string;
  characters: { id: string; nom: string }[];
};

/** Bouton « + Points » d'une ligne de membre : ouvre un petit formulaire. */
export default function PointsButton({ userProfileId, name, characters }: Props) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [points, setPoints] = useState("5");
  const [reason, setReason] = useState("Contribution");
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [countAsContribution, setCountAsContribution] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const close = () => dialog.current?.close();

  return (
    <>
      <Button
        onClick={() => {
          setError(null);
          dialog.current?.showModal();
        }}
        className="min-h-8 px-2.5 text-[13px]"
      >
        + Points
      </Button>
      <dialog
        ref={dialog}
        className="m-auto w-[min(92vw,460px)] rounded-xl border border-[#2C3038] bg-[#15171B] p-0 text-[#ECECEE] backdrop:bg-black/60"
      >
        <form
          className="flex flex-col gap-3.5 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await addPoints({
                userProfileId,
                points: Number(points) || 0,
                reason,
                characterId,
                countAsContribution,
              });
              if (!r.ok) return setError(r.error);
              close();
              setCharacterId(null);
              router.refresh();
            });
          }}
        >
          <h2 className="m-0 text-[17px] font-bold">Points pour {name}</h2>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setPoints(String(p.points));
                  setReason(p.reason);
                }}
                className="rounded-full border border-[#2C3038] px-3 py-1 text-xs font-medium hover:bg-[#1F2228]"
              >
                {p.label}
              </button>
            ))}
          </div>
          <Field label="Points">
            <TextInput
              type="number"
              min={0}
              max={1000}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </Field>
          <Field label="Motif">
            <TextInput value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Field
            label="Personnage (optionnel)"
            hint="Le membre apparaîtra dans les contributeurs de sa fiche. Mets 0 point pour un simple crédit."
          >
            <SearchSelect
              label="Personnage"
              options={characters.map((c) => ({ value: c.id, label: c.nom }))}
              value={characterId}
              onChange={setCharacterId}
              placeholder="Choisir un personnage…"
            />
          </Field>
          <label className="flex items-start gap-2 text-[13px] text-[#C4C7CF]">
            <input
              type="checkbox"
              checked={countAsContribution}
              onChange={(e) => setCountAsContribution(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#2F6FEB]"
            />
            <span>
              Compter comme un ajout validé
              <span className="block text-[12px] text-[#9AA0AA]">
                Fait avancer les badges (Premier pas, Contributeur, Expert, Légende).
              </span>
            </span>
          </label>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex justify-end gap-2">
            <Button onClick={close}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={pending || !reason.trim()}>
              Attribuer
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
