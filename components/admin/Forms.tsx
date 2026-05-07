"use client";

import Modal from "@/components/ui/Modal";
import { Character, Player, Version } from "@/lib/db";
import { useEffect, useRef, useState } from "react";

const REL_TYPES = [
  "Père",
  "Mère",
  "Fils",
  "Fille",
  "Frère",
  "Sœur",
  "Cousin",
  "Cousine",
  "Oncle",
  "Tante",
  "Grand-père",
  "Grand-mère",
  "Ami",
  "Amie",
  "Associé",
  "Associée",
  "Rival",
  "Rivale",
  "Ennemi",
  "Ennemie",
  "Mentor",
  "Protégé",
  "Partenaire",
  "Ex",
  "Autre",
];

const inp = {
  background: "#1a1824",
  border: "0.5px solid #2a2535",
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 13,
  color: "#e2dff0",
  fontFamily: "Inter,sans-serif",
  width: "100%",
  outline: "none",
};
const lbl = {
  fontSize: 11,
  fontWeight: 500,
  color: "#4a4560",
  textTransform: "uppercase" as const,
  letterSpacing: ".5px",
  display: "block",
  marginBottom: 4,
};
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

// -----------------------------------------------
// Autocomplete joueur — cherche parmi les existants
// et propose "Créer X" si introuvable
// -----------------------------------------------
type PlayerAutoCompleteProps = {
  players: Player[];
  defaultValue?: string; // pseudo initial (mode édition)
  onSelect: (player: Player | null, newPseudo: string | null) => void;
};

function PlayerAutoComplete({
  players,
  defaultValue,
  onSelect,
}: PlayerAutoCompleteProps) {
  const [query, setQuery] = useState(defaultValue || "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? players.filter((p) =>
        p.pseudo.toLowerCase().includes(query.toLowerCase()),
      )
    : players;

  const exactMatch = players.find(
    (p) => p.pseudo.toLowerCase() === query.toLowerCase(),
  );
  const showCreate = query.trim() && !exactMatch;

  // Ferme le dropdown si clic extérieur
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function pick(player: Player) {
    setQuery(player.pseudo);
    setOpen(false);
    onSelect(player, null);
  }

  function pickNew() {
    setOpen(false);
    onSelect(null, query.trim());
  }

  function onKey(e: React.KeyboardEvent) {
    const total = filtered.length + (showCreate ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, total - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted < filtered.length) {
        if (filtered[highlighted]) pick(filtered[highlighted]);
      } else if (showCreate) pickNew();
    }
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(0);
          onSelect(null, null);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="Rechercher ou créer un joueur..."
        style={inp}
        autoComplete="off"
      />
      {open && (filtered.length > 0 || showCreate) && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "#1a1824",
            border: "0.5px solid #2a2535",
            borderRadius: 8,
            marginTop: 4,
            overflow: "hidden",
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {filtered.map((p, i) => (
            <div
              key={p.id}
              onMouseDown={() => pick(p)}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                cursor: "pointer",
                background: i === highlighted ? "#2a2535" : "transparent",
                color: "#e2dff0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{p.pseudo}</span>
              <span style={{ fontSize: 11, color: "#4a4560" }}>
                {p.discord || ""}
              </span>
            </div>
          ))}
          {showCreate && (
            <div
              onMouseDown={pickNew}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                cursor: "pointer",
                background:
                  highlighted === filtered.length ? "#2a2535" : "transparent",
                color: "#a78bfa",
                borderTop: filtered.length ? "0.5px solid #2a2535" : "none",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 99,
                  background: "#2a1040",
                  border: "0.5px solid #4c2d8a",
                  color: "#a78bfa",
                  fontWeight: 600,
                }}
              >
                NOUVEAU
              </span>
              Créer « {query.trim()} »
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------
// Formulaire personnage
// -----------------------------------------------
type CharFormProps = {
  editing: Character | null;
  players: Player[];
  versions: Version[];
  characters: Character[];
  onClose: () => void;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    rels: { type: string; targetId: number }[],
    playerSelection: { existingId: string | null; newPseudo: string | null },
  ) => void;
};

export function CharacterForm({
  editing,
  players,
  versions,
  characters,
  onClose,
  onSubmit,
}: CharFormProps) {
  const [rels, setRels] = useState<{ type: string; targetId: number }[]>(
    (editing?.relations || []).map((r: any) => ({
      type: r.relation_type,
      targetId: r.target_id,
    })),
  );
  const [playerSel, setPlayerSel] = useState<{
    existingId: string | null;
    newPseudo: string | null;
  }>({
    existingId: (editing?.player as any)?.id || null,
    newPseudo: null,
  });
  const [newPlayerExpanded, setNewPlayerExpanded] = useState(false);

  function handlePlayerSelect(player: Player | null, newPseudo: string | null) {
    if (player) {
      setPlayerSel({ existingId: player.id, newPseudo: null });
      setNewPlayerExpanded(false);
    } else if (newPseudo) {
      setPlayerSel({ existingId: null, newPseudo });
      setNewPlayerExpanded(true);
    } else {
      setPlayerSel({ existingId: null, newPseudo: null });
      setNewPlayerExpanded(false);
    }
  }

  return (
    <Modal
      title={editing ? `Modifier — ${editing.name}` : "Nouveau personnage"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => onSubmit(e, rels, playerSel)}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <div>
            <label style={lbl}>Nom</label>
            <input
              name="name"
              defaultValue={editing?.name || ""}
              required
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Rôle / Métier</label>
            <input
              name="job"
              defaultValue={editing?.job || ""}
              required
              style={inp}
            />
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {/* Joueur avec autocomplétion */}
          <div>
            <label style={lbl}>Joueur</label>
            <PlayerAutoComplete
              players={players}
              defaultValue={(editing?.player as any)?.pseudo || ""}
              onSelect={handlePlayerSelect}
            />
            {/* Champs supplémentaires si nouveau joueur */}
            {newPlayerExpanded && (
              <div
                style={{
                  marginTop: 8,
                  padding: 10,
                  background: "#111019",
                  borderRadius: 8,
                  border: "0.5px solid #4c2d8a",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#a78bfa",
                    fontWeight: 500,
                    marginBottom: 2,
                  }}
                >
                  Nouveau joueur — « {playerSel.newPseudo} »
                </div>
                <input
                  name="new_discord"
                  placeholder="Discord (optionnel)"
                  style={{ ...inp, fontSize: 12 }}
                />
                <input
                  name="new_tiktok"
                  placeholder="TikTok / Instagram (optionnel)"
                  style={{ ...inp, fontSize: 12 }}
                />
                <input
                  name="new_stream"
                  placeholder="Lien Twitch / YouTube (optionnel)"
                  style={{ ...inp, fontSize: 12 }}
                />
              </div>
            )}
          </div>

          {/* Version */}
          <div>
            <label style={lbl}>Version</label>
            <select
              name="version_id"
              defaultValue={editing?.version_id || ""}
              required
              style={inp}
            >
              <option value="">— Sélectionner —</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} — {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={lbl}>Description</label>
          <textarea
            name="description"
            defaultValue={editing?.description || ""}
            style={{ ...inp, resize: "vertical", minHeight: 60 }}
          />
        </div>
        <div>
          <label style={lbl}>Tags (virgules)</label>
          <input
            name="tags"
            defaultValue={(editing?.tags || []).join(", ")}
            style={inp}
          />
        </div>

        <RelationsEditor
          rels={rels}
          onChange={setRels}
          characters={characters}
          excludeId={editing?.id}
        />

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 4,
          }}
        >
          <button type="button" style={bS} onClick={onClose}>
            Annuler
          </button>
          <button
            type="submit"
            style={bP}
            disabled={!playerSel.existingId && !playerSel.newPseudo}
          >
            {editing ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// -----------------------------------------------
// Éditeur de relations
// -----------------------------------------------
function RelationsEditor({
  rels,
  onChange,
  characters,
  excludeId,
}: {
  rels: { type: string; targetId: number }[];
  onChange: (r: { type: string; targetId: number }[]) => void;
  characters: Character[];
  excludeId?: number;
}) {
  const [relQuery, setRelQuery] = useState("");
  const [relType, setRelType] = useState(REL_TYPES[0]);
  const [relOpen, setRelOpen] = useState(false);
  const [relTarget, setRelTarget] = useState<Character | null>(null);
  const relRef = useRef<HTMLDivElement>(null);

  const filteredChars = relQuery
    ? characters.filter(
        (c) =>
          c.id !== excludeId &&
          c.name.toLowerCase().includes(relQuery.toLowerCase()),
      )
    : characters.filter((c) => c.id !== excludeId);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (relRef.current && !relRef.current.contains(e.target as Node))
        setRelOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function addRel() {
    if (!relTarget || rels.find((r) => r.targetId === relTarget.id)) return;
    onChange([...rels, { type: relType, targetId: relTarget.id }]);
    setRelQuery("");
    setRelTarget(null);
    setRelOpen(false);
  }

  return (
    <div>
      <label style={lbl}>Relations</label>
      <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
        <select
          value={relType}
          onChange={(e) => setRelType(e.target.value)}
          style={{ ...inp, flex: "0 0 120px" }}
        >
          {REL_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <div ref={relRef} style={{ position: "relative", flex: 1 }}>
          <input
            value={relQuery}
            onChange={(e) => {
              setRelQuery(e.target.value);
              setRelOpen(true);
              setRelTarget(null);
            }}
            onFocus={() => setRelOpen(true)}
            placeholder="Chercher un personnage..."
            style={inp}
            autoComplete="off"
          />
          {relOpen && filteredChars.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 50,
                background: "#1a1824",
                border: "0.5px solid #2a2535",
                borderRadius: 8,
                marginTop: 4,
                maxHeight: 160,
                overflowY: "auto",
              }}
            >
              {filteredChars.map((c) => (
                <div
                  key={c.id}
                  onMouseDown={() => {
                    setRelTarget(c);
                    setRelQuery(c.name);
                    setRelOpen(false);
                  }}
                  style={{
                    padding: "7px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                    color: "#e2dff0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#2a2535")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>{c.name}</span>
                  <span style={{ fontSize: 10, color: "#4a4560" }}>
                    {c.version_id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          style={{
            ...bS,
            padding: "8px 12px",
            flexShrink: 0,
            opacity: relTarget ? 1 : 0.4,
          }}
          onClick={addRel}
        >
          +
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {rels.map((r, i) => {
          const tc = characters.find((c) => c.id === r.targetId);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "7px 10px",
                background: "#1a1824",
                borderRadius: 8,
                fontSize: 13,
                border: "0.5px solid #2a2535",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: "#2a1040",
                    border: "0.5px solid #4c2d8a",
                    color: "#a78bfa",
                    fontFamily: "'Rajdhani',sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {r.type}
                </span>
                <span style={{ color: "#e2dff0" }}>{tc?.name || "?"}</span>
              </div>
              <button
                type="button"
                style={{ ...bS, padding: "3px 8px", fontSize: 12 }}
                onClick={() => onChange(rels.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------
// Formulaire joueur (standalone)
// -----------------------------------------------
type PlayerFormProps = {
  editing: Player | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function PlayerForm({ editing, onClose, onSubmit }: PlayerFormProps) {
  return (
    <Modal
      title={editing ? `Modifier — ${editing.pseudo}` : "Nouveau joueur"}
      onClose={onClose}
      maxWidth={400}
    >
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        {editing ? (
          <div>
            <label style={lbl}>Pseudo</label>
            <input
              value={editing.pseudo}
              disabled
              style={{ ...inp, opacity: 0.4 }}
            />
          </div>
        ) : (
          <div>
            <label style={lbl}>Pseudo</label>
            <input
              name="pseudo"
              placeholder="ex: Maxime_B"
              required
              style={inp}
            />
          </div>
        )}
        <div>
          <label style={lbl}>Discord</label>
          <input
            name="discord"
            defaultValue={editing?.discord || ""}
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>TikTok / Instagram</label>
          <input
            name="tiktok"
            defaultValue={editing?.tiktok || ""}
            placeholder="@pseudo"
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Lien Twitch / YouTube</label>
          <input
            name="stream_url"
            defaultValue={editing?.stream_url || ""}
            placeholder="https://..."
            style={inp}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" style={bS} onClick={onClose}>
            Annuler
          </button>
          <button type="submit" style={bP}>
            {editing ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// -----------------------------------------------
// Formulaire version
// -----------------------------------------------
type VersionFormProps = {
  editing: Version | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function VersionForm({ editing, onClose, onSubmit }: VersionFormProps) {
  return (
    <Modal
      title={editing ? `Modifier ${editing.id}` : "Nouvelle version"}
      onClose={onClose}
      maxWidth={380}
    >
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        {!editing && (
          <div>
            <label style={lbl}>Identifiant (ex: V5)</label>
            <input name="id" placeholder="V5" required style={inp} />
          </div>
        )}
        <div>
          <label style={lbl}>Nom affiché</label>
          <input
            name="label"
            defaultValue={editing?.label || ""}
            required
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Description</label>
          <input
            name="description"
            defaultValue={editing?.description || ""}
            style={inp}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" style={bS} onClick={onClose}>
            Annuler
          </button>
          <button type="submit" style={bP}>
            {editing ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
