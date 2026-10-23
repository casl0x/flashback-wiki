"use client";

import {
  Button,
  ETAT_COLORS,
  ETAT_LABELS,
  Notice,
  Select,
} from "@/app/_composents/admin/ui";
import { bulkSetVersion } from "@/lib/admin/actions/characters";
import { cloudinaryUrl, initials } from "@/lib/cloudinary";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Row = {
  id: string;
  nom: string;
  imageUrl: string | null;
  versions: { id: string; color: string }[];
  job: string | null;
  player: { id: string; pseudo: string } | null;
  etatVie: keyof typeof ETAT_LABELS;
};

export default function CharactersTable({
  rows,
  versions,
}: {
  rows: Row[];
  versions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [version, setVersion] = useState(versions[0]?.id ?? "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  const allOn = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const bulk = (mode: "add" | "remove") =>
    start(async () => {
      const r = await bulkSetVersion([...selected], version, mode);
      if (!r.ok) return setMsg({ tone: "error", text: r.error });
      setMsg({ tone: "ok", text: `${r.data.count} fiche(s) mise(s) à jour.` });
      setSelected(new Set());
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-[10px] border border-[#22385E] bg-[#13213A] px-3.5 py-2.5">
          <span className="font-semibold">{selected.size} sélectionné(s)</span>
          <span className="text-[#A3A8B3]">Version :</span>
          <Select
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            aria-label="Version"
            className="w-auto"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </Select>
          <Button disabled={pending} onClick={() => bulk("add")}>
            Ajouter
          </Button>
          <Button disabled={pending} onClick={() => bulk("remove")}>
            Retirer
          </Button>
          <Button variant="ghost" onClick={() => setSelected(new Set())}>
            Annuler
          </Button>
        </div>
      )}
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <div className="overflow-x-auto rounded-[10px] border border-[#23262D]">
        <table className="w-full min-w-190 border-collapse text-left text-[14px]">
          <thead>
            <tr className="bg-[#1A1C21] text-[11px] uppercase tracking-widest text-[#A3A8B3]">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  aria-label="Tout sélectionner"
                  checked={allOn}
                  onChange={() =>
                    setSelected(
                      allOn ? new Set() : new Set(rows.map((r) => r.id)),
                    )
                  }
                  className="h-4 w-4 accent-[#2F6FEB]"
                />
              </th>
              <th scope="col" className="px-3 py-2.5">
                Nom
              </th>
              <th scope="col" className="px-3 py-2.5">
                Versions
              </th>
              <th scope="col" className="px-3 py-2.5">
                Groupe / métier
              </th>
              <th scope="col" className="px-3 py-2.5">
                Joueur
              </th>
              <th scope="col" className="px-3 py-2.5">
                État
              </th>
              <th scope="col" className="px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="bg-[#15171B] px-3 py-8 text-center text-[#9AA0AA]"
                >
                  Aucune fiche.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-[#23262D] bg-[#15171B] hover:bg-[#1A1D23]"
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Sélectionner ${r.nom}`}
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="h-4 w-4 accent-[#2F6FEB]"
                  />
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/characters/${r.id}`}
                    className="flex items-center gap-2.5 font-semibold text-[#ECECEE] hover:underline"
                  >
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cloudinaryUrl(
                          r.imageUrl,
                          "w_64,h_64,c_fill,g_face",
                        )}
                        alt=""
                        className="h-8 w-8 flex-none rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#2B2E35] text-[11px] font-bold text-[#C4C7CF]"
                      >
                        {initials(r.nom)}
                      </span>
                    )}
                    {r.nom}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <span className="flex flex-wrap gap-1">
                    {r.versions.length === 0 && (
                      <span className="text-[#6E7380]">—</span>
                    )}
                    {r.versions.map((v) => (
                      <span
                        key={v.id}
                        className="rounded px-1.5 py-px text-[11px] font-bold text-[#121212]"
                        style={{ background: v.color }}
                      >
                        {v.id}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-3 py-2 text-[#C4C7CF]">
                  {r.job ?? <span className="text-[#6E7380]">—</span>}
                </td>
                <td className="px-3 py-2">
                  {r.player ? (
                    <Link
                      href={`/admin/players/${r.player.id}`}
                      className="text-[#C4C7CF] hover:underline"
                    >
                      {r.player.pseudo}
                    </Link>
                  ) : (
                    <span className="text-[#6E7380]">—</span>
                  )}
                </td>
                <td
                  className="px-3 py-2 font-semibold"
                  style={{ color: ETAT_COLORS[r.etatVie] }}
                >
                  {ETAT_LABELS[r.etatVie]}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/characters/${r.id}`}
                    className="inline-flex min-h-8 items-center rounded-md border border-[#3A3E47] px-2.5 text-[13px] text-[#ECECEE] hover:bg-[#1F2228]"
                  >
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
