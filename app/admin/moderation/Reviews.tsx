"use client";

import { Button, Notice, TextArea } from "@/app/_composents/admin/ui";
import {
  acceptSuggestion,
  askSuggestionDetails,
  rejectSuggestion,
  reviewCreation,
  reviewCreatorRole,
  reviewLinkRequest,
} from "@/lib/admin/actions/moderation";
import { ago } from "@/lib/admin/format";
import type {
  loadCreationDetail,
  loadCreatorRoleDetail,
  loadLinkRequestDetail,
  loadSuggestionDetail,
} from "@/lib/admin/moderation";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { MoreHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type D<F extends (...a: never[]) => unknown> = NonNullable<
  Awaited<ReturnType<F>>
>;
type Result = { ok: true } | { ok: false; error: string };

const REASONS: Record<string, string> = {
  "Source manquante":
    "Merci pour ta proposition ! Il manque une source (clip, live, capture) pour qu’on puisse la valider.",
  "Infos incorrectes":
    "Certaines infos ne correspondent pas à ce qu’on a pu vérifier. N’hésite pas à reproposer avec une source.",
  Doublon: "Ce personnage ou cette modification existe déjà sur le wiki.",
  "Hors serveur": "Ce contenu ne concerne pas Flashback WL.",
  "Image non conforme":
    "L’image ne respecte pas les règles (qualité, contenu ou droits).",
  Autre: "",
};

/** Lance une action serveur puis passe à l'élément suivant. */
function useReview(nextHref: string) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const run = (
    fn: () => Promise<Result>,
    opts?: { stay?: string; goTo?: (r: Result) => string | null },
  ) =>
    start(async () => {
      setError(null);
      setInfo(null);
      const r = await fn();
      if (!r.ok) return setError(r.error);
      if (opts?.stay) return setInfo(opts.stay);
      router.push(opts?.goTo?.(r) ?? nextHref);
      router.refresh();
    });
  return { pending, error, info, run };
}

function Shell({
  kind,
  kindColor,
  title,
  meta,
  children,
}: {
  kind: string;
  kindColor: string;
  title: string;
  meta: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="det-h"
      className="flex flex-col gap-4 rounded-xl border border-[#23262D] bg-[#15171B] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-bold" style={{ color: kindColor }}>
          {kind}
        </span>
        <h2 id="det-h" className="m-0 text-[22px] font-bold">
          {title}
        </h2>
        <span className="text-[13px] text-[#9AA0AA]">{meta}</span>
      </div>
      {children}
    </section>
  );
}

function RefusePanel({
  onCancel,
  onConfirm,
  pending,
  withReasons = true,
}: {
  onCancel: () => void;
  onConfirm: (reason: string, message: string) => void;
  pending: boolean;
  withReasons?: boolean;
}) {
  const [reason, setReason] = useState("Source manquante");
  const [message, setMessage] = useState(
    withReasons ? REASONS["Source manquante"] : "",
  );
  return (
    <div className="flex flex-col gap-3.5 rounded-[10px] border border-[#5A2A2E] bg-[#1A1214] p-4">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[#FFC9CB]">
          {withReasons ? "Motif du refus" : "Refuser"}
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Annuler le refus"
          className="flex h-9 w-9 items-center justify-center text-[#9AA0AA]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {withReasons && (
        <div
          role="radiogroup"
          aria-label="Motif"
          className="flex flex-wrap gap-2"
        >
          {Object.keys(REASONS).map((k) => {
            const on = k === reason;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setReason(k);
                  setMessage(REASONS[k]);
                }}
                className={cn(
                  "min-h-8 rounded-full border px-3.5 text-[13px] font-semibold",
                  on
                    ? "border-[#FF8A8E] bg-[#3A1E21] text-[#FFC9CB]"
                    : "border-[#3A3E47] text-[#C4C7CF]",
                )}
              >
                {k}
              </button>
            );
          })}
        </div>
      )}
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#C4C7CF]">
        Message envoyé à l’auteur en notification
        <TextArea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <div className="flex justify-end gap-2.5">
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          className="bg-[#C8343A] text-white hover:bg-[#B02E33]"
          disabled={pending}
          onClick={() => onConfirm(withReasons ? reason : "", message)}
        >
          Confirmer le refus
        </Button>
      </div>
    </div>
  );
}

// ─── Propositions ────────────────────────────────────────────────────────────

export function SuggestionReview({
  d,
  nextHref,
}: {
  d: D<typeof loadSuggestionDetail>;
  nextHref: string;
}) {
  const { pending, error, info, run } = useReview(nextHref);
  const [note, setNote] = useState("");
  const [refusing, setRefusing] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <Shell
      kind={d.isNew ? "NOUVEAU PERSO" : "MODIFICATION"}
      kindColor={d.isNew ? "#8AB4FF" : "#F6B26B"}
      title={d.title}
      meta={
        <>
          Proposée par {d.author} · {ago(d.createdAt)}
          {d.characterId && (
            <>
              {" · "}
              <Link
                href={`/personnages/${d.characterId}`}
                target="_blank"
                className="text-[#8AB4FF]"
              >
                voir la fiche ↗
              </Link>
            </>
          )}
        </>
      }
    >
      {d.rows.length > 0 ? (
        <div className="overflow-x-auto rounded-[10px] border border-[#23262D]">
          <table className="w-full min-w-120 border-collapse text-left">
            <thead>
              <tr className="bg-[#1A1C21] text-[11px] uppercase tracking-widest text-[#A3A8B3]">
                <th scope="col" className="w-35 px-3 py-2">
                  Champ
                </th>
                <th scope="col" className="px-3 py-2">
                  Avant
                </th>
                <th scope="col" className="px-3 py-2">
                  Après
                </th>
              </tr>
            </thead>
            <tbody>
              {d.rows.map((r) => (
                <tr
                  key={r.field}
                  className="border-t border-[#23262D] align-top"
                >
                  <th
                    scope="row"
                    className="px-3 py-2.5 font-semibold text-[#C4C7CF]"
                  >
                    {r.field}
                  </th>
                  <td className="whitespace-pre-line bg-[#1E1214] px-3 py-2.5 text-[#FF9A9E] line-through">
                    {r.before}
                  </td>
                  <td className="whitespace-pre-line bg-[#0F2218] px-3 py-2.5 text-[#7FF0B0]">
                    {r.after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="m-0 text-[#9AA0AA]">
          Aucun changement par rapport à la fiche actuelle.
        </p>
      )}

      {d.note && (
        <div className="flex flex-col gap-1.5 rounded-lg bg-[#1A1C21] px-3.5 py-3">
          <span className="text-[12px] font-bold text-[#A3A8B3]">
            Note de l’utilisateur
          </span>
          <span className="whitespace-pre-line">{d.note}</span>
        </div>
      )}

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#C4C7CF]">
        Message à l’auteur (optionnel)
        <TextArea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Envoyé avec la notification de validation, ou comme question."
        />
      </label>

      <div className="relative flex flex-wrap items-center gap-2.5">
        <Button
          variant="success"
          className="min-h-11 px-5"
          disabled={pending}
          onClick={() => run(() => acceptSuggestion(d.id, note))}
        >
          Valider
        </Button>
        <Button
          variant="danger"
          className={cn(
            "min-h-11",
            refusing && "border-[#FF8A8E] bg-[#2A1416]",
          )}
          aria-expanded={refusing}
          onClick={() => {
            setRefusing(true);
            setMenu(false);
          }}
        >
          Refuser
        </Button>
        <Button
          aria-label="Autres actions"
          aria-expanded={menu}
          className="h-11 w-11 px-0"
          onClick={() => setMenu((m) => !m)}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
        <span className="ml-auto text-[12px] text-[#9AA0AA]">
          Après l’action : élément suivant
        </span>
        {menu && (
          <div
            role="menu"
            className="absolute bottom-14 left-0 z-10 flex w-66 flex-col rounded-[10px] border border-[#2C3038] bg-[#1A1C21] p-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.5)] sm:left-48"
          >
            <button
              type="button"
              role="menuitem"
              className="min-h-10 rounded-md px-2.5 text-left hover:bg-[#22252B]"
              onClick={() =>
                run(() => acceptSuggestion(d.id, note), {
                  goTo: (r) => {
                    const id =
                      "data" in r
                        ? (r as { data: { characterId: string | null } }).data
                            .characterId
                        : null;
                    return id ? `/admin/characters/${id}` : null;
                  },
                })
              }
            >
              Valider puis modifier la fiche
            </button>
            <button
              type="button"
              role="menuitem"
              className="min-h-10 rounded-md px-2.5 text-left hover:bg-[#22252B]"
              onClick={() => {
                setMenu(false);
                run(() => askSuggestionDetails(d.id, note), {
                  stay: "Question envoyée à l’auteur.",
                });
              }}
            >
              Demander des précisions (avec le message)
            </button>
          </div>
        )}
      </div>

      {refusing && (
        <RefusePanel
          pending={pending}
          onCancel={() => setRefusing(false)}
          onConfirm={(reason, message) =>
            run(() => rejectSuggestion(d.id, reason, message))
          }
        />
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {info && <Notice tone="ok">{info}</Notice>}
    </Shell>
  );
}

// ─── Créations (posts des créateurs) ─────────────────────────────────────────

export function CreationReview({
  d,
  nextHref,
}: {
  d: D<typeof loadCreationDetail>;
  nextHref: string;
}) {
  const { pending, error, run } = useReview(nextHref);
  const [refusing, setRefusing] = useState(false);
  return (
    <Shell
      kind={`${d.type === "ARTISTE" ? "ARTISTE" : "ÉDITEUR"} · POST`}
      kindColor="#E5A3F0"
      title={d.characters.map((c) => c.nom).join(", ") || "Création"}
      meta={`Publiée par ${d.author} · ${ago(d.createdAt)}`}
    >
      {d.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cloudinaryUrl(d.imageUrl, "w_900,c_limit")}
          alt={d.caption ?? "Création"}
          className="max-h-105 w-auto max-w-full self-start rounded-[10px] border border-[#23262D]"
        />
      )}
      {d.linkUrl && (
        <a
          href={d.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-[#8AB4FF]"
        >
          {d.platform ? `${d.platform} · ` : ""}Ouvrir le lien ↗
        </a>
      )}
      {d.caption && <p className="m-0 whitespace-pre-line">{d.caption}</p>}
      {d.characters.length > 0 && (
        <p className="m-0 text-[13px] text-[#9AA0AA]">
          Persos tagués :{" "}
          {d.characters.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ", "}
              <Link
                href={`/personnages/${c.id}`}
                target="_blank"
                className="text-[#8AB4FF]"
              >
                {c.nom}
              </Link>
            </span>
          ))}
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <Button
          variant="success"
          className="min-h-11 px-5"
          disabled={pending}
          onClick={() => run(() => reviewCreation(d.id, "approved"))}
        >
          Garder
        </Button>
        <Button
          variant="danger"
          className="min-h-11"
          onClick={() => setRefusing(true)}
        >
          Retirer
        </Button>
      </div>
      {refusing && (
        <RefusePanel
          withReasons={false}
          pending={pending}
          onCancel={() => setRefusing(false)}
          onConfirm={(_, message) =>
            run(() => reviewCreation(d.id, "rejected", message))
          }
        />
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </Shell>
  );
}

// ─── Demandes de profil créateur ─────────────────────────────────────────────

export function CreatorRoleReview({
  d,
  nextHref,
}: {
  d: D<typeof loadCreatorRoleDetail>;
  nextHref: string;
}) {
  const { pending, error, run } = useReview(nextHref);
  const [refusing, setRefusing] = useState(false);
  return (
    <Shell
      kind={d.type === "ARTISTE" ? "DEMANDE ARTISTE" : "DEMANDE ÉDITEUR"}
      kindColor="#F6B26B"
      title={d.author}
      meta={`Demande envoyée ${ago(d.createdAt)}`}
    >
      {d.bio && <p className="m-0 whitespace-pre-line">{d.bio}</p>}
      {d.links.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {d.links.map((l) => (
            <li key={l.url}>
              <span className="text-[#9AA0AA]">{l.platform} · </span>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8AB4FF]"
              >
                {l.url}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[#9AA0AA]">Aucun lien fourni.</p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <Button
          variant="success"
          className="min-h-11 px-5"
          disabled={pending}
          onClick={() => run(() => reviewCreatorRole(d.id, "approved"))}
        >
          Valider le profil
        </Button>
        <Button
          variant="danger"
          className="min-h-11"
          onClick={() => setRefusing(true)}
        >
          Refuser
        </Button>
      </div>
      {refusing && (
        <RefusePanel
          withReasons={false}
          pending={pending}
          onCancel={() => setRefusing(false)}
          onConfirm={(_, message) =>
            run(() => reviewCreatorRole(d.id, "rejected", message))
          }
        />
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </Shell>
  );
}

// ─── Demandes de lien compte ↔ fiche joueur ──────────────────────────────────

export function LinkRequestReview({
  d,
  nextHref,
}: {
  d: D<typeof loadLinkRequestDetail>;
  nextHref: string;
}) {
  const { pending, error, run } = useReview(nextHref);
  const [refusing, setRefusing] = useState(false);
  return (
    <Shell
      kind="LIEN JOUEUR"
      kindColor="#6EE7A0"
      title={`${d.author} → ${d.player.pseudo}`}
      meta={`Demande envoyée ${ago(d.createdAt)}`}
    >
      <p className="m-0">
        Le compte <strong>{d.author}</strong> demande à être lié à la fiche
        joueur{" "}
        <Link href={`/admin/players/${d.player.id}`} className="text-[#8AB4FF]">
          {d.player.pseudo}
        </Link>{" "}
        ({d.player.characters} persos).
      </p>
      {d.alreadyLinkedTo && (
        <Notice tone="error">
          Cette fiche est déjà liée à {d.alreadyLinkedTo}. Valider remplacera ce
          lien.
        </Notice>
      )}
      {d.message && (
        <div className="flex flex-col gap-1.5 rounded-lg bg-[#1A1C21] px-3.5 py-3">
          <span className="text-[12px] font-bold text-[#A3A8B3]">
            Message de l’utilisateur
          </span>
          <span className="whitespace-pre-line">{d.message}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2.5">
        <Button
          variant="success"
          className="min-h-11 px-5"
          disabled={pending}
          onClick={() => run(() => reviewLinkRequest(d.id, "accepted"))}
        >
          Lier le compte
        </Button>
        <Button
          variant="danger"
          className="min-h-11"
          onClick={() => setRefusing(true)}
        >
          Refuser
        </Button>
      </div>
      {refusing && (
        <RefusePanel
          withReasons={false}
          pending={pending}
          onCancel={() => setRefusing(false)}
          onConfirm={(_, message) =>
            run(() => reviewLinkRequest(d.id, "rejected", message))
          }
        />
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </Shell>
  );
}
