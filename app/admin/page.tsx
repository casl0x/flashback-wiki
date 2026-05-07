"use client";

import {
  CharacterForm,
  PlayerForm,
  VersionForm,
} from "@/components/admin/Forms";
import StatusBadge from "@/components/ui/StatusBadge";
import Toast from "@/components/ui/Toast";
import VersionPill from "@/components/ui/VersionPill";
import { Character, Player, Version } from "@/lib/db";
import { useAdmin } from "@/lib/useAdmin";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ModalType =
  | null
  | "add-char"
  | "edit-char"
  | "add-player"
  | "edit-player"
  | "add-version"
  | "edit-version";

const adminCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500&display=swap');
  .ar{min-height:100vh;background:#0d0c10;font-family:'Inter',sans-serif;color:#e2dff0}
  .an{display:flex;align-items:center;justify-content:space-between;padding:11px 22px;border-bottom:0.5px solid #1e1c2a;background:#111019;position:sticky;top:0;z-index:10}
  .anb{display:flex;align-items:center;gap:9px}
  .al{width:28px;height:28px;background:#7C3AED;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px;color:white}
  .at2{font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:#e2dff0;letter-spacing:.5px}
  .at2 span{color:#a78bfa}
  .abadge{font-size:10px;padding:3px 9px;background:#2a1040;border:0.5px solid #4c2d8a;border-radius:99px;color:#a78bfa;font-weight:600;letter-spacing:.3px}
  .abody{padding:20px 24px;max-width:1000px;margin:0 auto}
  .atabs{display:flex;gap:4px;margin-bottom:20px;border-bottom:0.5px solid #1e1c2a}
  .atab{padding:8px 16px;font-size:13px;border-radius:8px 8px 0 0;cursor:pointer;border:0.5px solid transparent;border-bottom:none;background:transparent;color:#4a4560;transition:all .15s;margin-bottom:-0.5px}
  .atab:hover{color:#8880a8;background:#1a1824}
  .atab.on{background:#111019;border-color:#2a2535;border-bottom-color:#111019;color:#e2dff0;font-weight:500}
  .asec{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;color:#e2dff0;letter-spacing:.3px;display:flex;align-items:center;gap:8px}
  .asec::before{content:'';width:3px;height:16px;background:#7C3AED;border-radius:99px;display:block}
`;

const bP = {
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 500,
  background: "#7C3AED",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};
const bS = {
  padding: "8px 16px",
  fontSize: 13,
  border: "0.5px solid #2a2535",
  borderRadius: 8,
  background: "transparent",
  color: "#8880a8",
  cursor: "pointer",
};

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAdmin, checking, adminFetch } = useAdmin();

  const [tab, setTab] = useState<"chars" | "players" | "versions">("chars");
  const [chars, setChars] = useState<Character[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [editing, setEditing] = useState<any>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
  }

  async function load() {
    const r = await fetch(`/api/data?t=${Date.now()}`, { cache: "no-store" });
    const d = await r.json();
    setVersions(d.versions || []);
    setPlayers(d.players || []);
    setChars(d.characters || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!checking) {
      if (!isAdmin) {
        router.push("/");
      } else {
        load();
      }
    }
  }, [checking, isAdmin]);

  // ---- Personnage ----
  async function handleSaveChar(
    e: React.FormEvent<HTMLFormElement>,
    rels: { type: string; targetId: number }[],
    playerSel: { existingId: string | null; newPseudo: string | null },
  ) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Si nouveau joueur — le créer d'abord
    let resolvedPlayerId = playerSel.existingId;
    if (!resolvedPlayerId && playerSel.newPseudo) {
      const pRes = await adminFetch("/api/players", {
        method: "POST",
        body: JSON.stringify({
          pseudo: playerSel.newPseudo,
          discord: fd.get("new_discord") || null,
          tiktok: fd.get("new_tiktok") || null,
          stream_url: fd.get("new_stream") || null,
        }),
      });
      if (!pRes.ok) {
        showToast("Erreur création joueur", "err");
        return;
      }
      const pData = await pRes.json();
      resolvedPlayerId = pData.id;
    }
    if (!resolvedPlayerId) {
      showToast("Sélectionne ou crée un joueur", "err");
      return;
    }

    const body: any = {
      name: fd.get("name"),
      job: fd.get("job"),
      description: fd.get("description"),
      tags: String(fd.get("tags"))
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean),
      version_id: fd.get("version_id"),
      player_id: resolvedPlayerId,
      status: fd.get("status") || null,
    };
    let charId: number;
    if (editing?.id) {
      const res = await adminFetch("/api/characters", {
        method: "PATCH",
        body: JSON.stringify({ id: editing.id, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, "err");
        return;
      }
      charId = editing.id;
      showToast(`${body.name} mis à jour !`);
    } else {
      const res = await adminFetch("/api/characters", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, "err");
        return;
      }
      charId = data.id;
      showToast(`${body.name} créé !`);
    }
    await adminFetch("/api/relations", {
      method: "PUT",
      body: JSON.stringify({ character_id: charId }),
    });
    await Promise.all(
      rels.map((r) =>
        adminFetch("/api/relations", {
          method: "POST",
          body: JSON.stringify({
            character_id: charId,
            target_id: r.targetId,
            relation_type: r.type,
          }),
        }),
      ),
    );
    closeModal();
    load();
  }

  async function handleDeleteChar(id: number, name: string) {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    const res = await adminFetch("/api/characters", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      showToast("Erreur", "err");
      return;
    }
    showToast("Supprimé");
    load();
  }

  // ---- Joueur ----
  async function handleSavePlayer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (editing?.id) {
      const body = {
        id: editing.id,
        discord: fd.get("discord"),
        tiktok: fd.get("tiktok"),
        stream_url: fd.get("stream_url"),
      };
      const res = await adminFetch("/api/players", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        showToast("Erreur", "err");
        return;
      }
      showToast("Joueur mis à jour !");
    } else {
      const pseudo = String(fd.get("pseudo") || "").trim();
      if (!pseudo) {
        showToast("Pseudo requis", "err");
        return;
      }
      if (
        players.find((p) => p.pseudo.toLowerCase() === pseudo.toLowerCase())
      ) {
        showToast("Ce pseudo existe déjà", "err");
        return;
      }
      const body = {
        pseudo,
        discord: fd.get("discord") || null,
        tiktok: fd.get("tiktok") || null,
        stream_url: fd.get("stream_url") || null,
      };
      const res = await adminFetch("/api/players", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error || "Erreur", "err");
        return;
      }
      showToast(`${pseudo} ajouté !`);
    }
    closeModal();
    load();
  }

  // ---- Version ----
  async function handleSaveVersion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      id: fd.get("id"),
      label: fd.get("label"),
      description: fd.get("description"),
    };
    const method = editing?.id ? "PATCH" : "POST";
    const payload = editing?.id ? { ...body, id: editing.id } : body;
    const res = await adminFetch("/api/versions", {
      method,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json();
      showToast(d.error, "err");
      return;
    }
    showToast("Version enregistrée !");
    closeModal();
    load();
  }

  async function handleDeleteVersion(id: string) {
    if (chars.some((c) => c.version_id === id)) {
      showToast("Retire d'abord les personnages", "err");
      return;
    }
    if (!confirm(`Supprimer ${id} ?`)) return;
    const res = await adminFetch("/api/versions", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      showToast("Erreur", "err");
      return;
    }
    showToast("Version supprimée");
    load();
  }

  if (checking || loading)
    return (
      <div
        style={{
          padding: 60,
          textAlign: "center",
          color: "#4a4560",
          background: "#0d0c10",
          minHeight: "100vh",
        }}
      >
        Chargement...
      </div>
    );

  const adminToken =
    searchParams.get("token") ||
    (typeof window !== "undefined"
      ? localStorage.getItem("admin_token")
      : "") ||
    "";

  return (
    <>
      <style>{adminCSS}</style>
      <div className="ar">
        {/* Nav */}
        <nav className="an">
          <div className="anb">
            <div className="al">⚡</div>
            <span className="at2">
              FLASH<span>BACK</span> WL
            </span>
            <span className="abadge">ADMIN</span>
          </div>
          <a
            href={`/?token=${adminToken}`}
            style={{ ...bS, textDecoration: "none", fontSize: 12 }}
          >
            ← Wiki public
          </a>
        </nav>

        <div className="abody">
          {/* Tabs */}
          <div className="atabs">
            {(["chars", "players", "versions"] as const).map((t) => (
              <button
                key={t}
                className={`atab ${tab === t ? "on" : ""}`}
                onClick={() => setTab(t)}
              >
                {t === "chars"
                  ? "Personnages"
                  : t === "players"
                    ? "Joueurs"
                    : "Versions"}
              </button>
            ))}
          </div>

          {/* ---- PERSONNAGES ---- */}
          {tab === "chars" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div className="asec">
                  Personnages{" "}
                  <span
                    style={{
                      fontSize: 13,
                      color: "#4a4560",
                      fontFamily: "Inter",
                      fontWeight: 400,
                    }}
                  >
                    ({chars.length})
                  </span>
                </div>
                <button
                  style={bP}
                  onClick={() => {
                    setEditing(null);
                    setModal("add-char");
                  }}
                >
                  + Nouveau personnage
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "22%" }}>Nom</th>
                      <th style={{ width: "16%" }}>Joueur</th>
                      <th style={{ width: "8%" }}>Ver.</th>
                      <th style={{ width: "22%" }}>Rôle</th>
                      <th style={{ width: "10%" }}>Liens</th>
                      <th style={{ width: "22%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chars.length ? (
                      chars.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.name}</strong>
                          </td>
                          <td>{(c.player as any)?.pseudo}</td>
                          <td>
                            <VersionPill version={c.version_id} />
                          </td>
                          <td>{c.job}</td>
                          <td>
                            {(c as any).status ? (
                              <StatusBadge status={(c as any).status} small />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={{ color: "#a78bfa" }}>
                            {(c.relations || []).length}
                          </td>
                          <td>
                            <button
                              className="btn-icon edit"
                              onClick={() => {
                                setEditing(c);
                                setModal("edit-char");
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon del"
                              onClick={() => handleDeleteChar(c.id!, c.name)}
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>
                          <div className="empty">Aucun personnage</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---- JOUEURS ---- */}
          {tab === "players" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div className="asec">
                  Joueurs{" "}
                  <span
                    style={{
                      fontSize: 13,
                      color: "#4a4560",
                      fontFamily: "Inter",
                      fontWeight: 400,
                    }}
                  >
                    ({players.length})
                  </span>
                </div>
                <button
                  style={bP}
                  onClick={() => {
                    setEditing(null);
                    setModal("add-player");
                  }}
                >
                  + Nouveau joueur
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "18%" }}>Pseudo</th>
                      <th style={{ width: "16%" }}>Discord</th>
                      <th style={{ width: "16%" }}>TikTok/IG</th>
                      <th style={{ width: "30%" }}>Stream</th>
                      <th style={{ width: "10%" }}>Persos</th>
                      <th style={{ width: "10%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.pseudo}</strong>
                        </td>
                        <td>{p.discord || "—"}</td>
                        <td>{p.tiktok || "—"}</td>
                        <td title={p.stream_url || ""}>
                          {p.stream_url || "—"}
                        </td>
                        <td style={{ color: "#a78bfa" }}>
                          {
                            chars.filter((c) => (c.player as any)?.id === p.id)
                              .length
                          }
                        </td>
                        <td>
                          <button
                            className="btn-icon edit"
                            onClick={() => {
                              setEditing(p);
                              setModal("edit-player");
                            }}
                          >
                            ✏️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---- VERSIONS ---- */}
          {tab === "versions" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div className="asec">Versions</div>
                <button
                  style={bP}
                  onClick={() => {
                    setEditing(null);
                    setModal("add-version");
                  }}
                >
                  + Nouvelle version
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "10%" }}>ID</th>
                      <th style={{ width: "22%" }}>Nom</th>
                      <th style={{ width: "40%" }}>Description</th>
                      <th style={{ width: "12%" }}>Persos</th>
                      <th style={{ width: "16%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <VersionPill version={v.id} />
                        </td>
                        <td>
                          <strong>{v.label}</strong>
                        </td>
                        <td>{v.description || "—"}</td>
                        <td style={{ color: "#a78bfa" }}>
                          {chars.filter((c) => c.version_id === v.id).length}
                        </td>
                        <td>
                          <button
                            className="btn-icon edit"
                            onClick={() => {
                              setEditing(v);
                              setModal("edit-version");
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon del"
                            onClick={() => handleDeleteVersion(v.id)}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ---- MODALES ---- */}
        {(modal === "add-char" || modal === "edit-char") && (
          <CharacterForm
            editing={modal === "edit-char" ? editing : null}
            players={players}
            versions={versions}
            characters={chars}
            onClose={closeModal}
            onSubmit={handleSaveChar}
          />
        )}

        {(modal === "add-player" || modal === "edit-player") && (
          <PlayerForm
            editing={modal === "edit-player" ? editing : null}
            onClose={closeModal}
            onSubmit={handleSavePlayer}
          />
        )}

        {(modal === "add-version" || modal === "edit-version") && (
          <VersionForm
            editing={modal === "edit-version" ? editing : null}
            onClose={closeModal}
            onSubmit={handleSaveVersion}
          />
        )}

        {toast && <Toast message={toast.msg} type={toast.type} />}
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: 60,
            textAlign: "center",
            color: "#4a4560",
            background: "#0d0c10",
            minHeight: "100vh",
          }}
        >
          Chargement...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
