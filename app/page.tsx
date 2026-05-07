"use client";

import CharacterCard from "@/components/wiki/CharacterCard";
import CharacterDetail from "@/components/wiki/CharacterDetail";
import NavBar from "@/components/wiki/NavBar";
import Sidebar from "@/components/wiki/Sidebar";
import { Character, Player, Version } from "@/lib/db";
import { useAdmin } from "@/lib/useAdmin";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import styles from "./page.module.css";

function WikiContent({
  chars,
  versions,
  selVer,
  query,
}: {
  chars: Character[];
  versions: Version[];
  selVer: string;
  query: string;
}) {
  const searchParams = useSearchParams();
  const { isAdmin } = useAdmin();
  const [selChar, setSelChar] = useState<Character | null>(null);

  useEffect(() => {
    setSelChar(null);
  }, [selVer, query]);

  const filtered = chars.filter((c) => {
    const mv = selVer === "all" || c.version_id === selVer;
    const q = query.toLowerCase();
    const ms =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.player as any)?.pseudo?.toLowerCase().includes(q) ||
      c.job.toLowerCase().includes(q) ||
      (c.tags || []).some((t: string) => t.toLowerCase().includes(q));
    return mv && ms;
  });

  if (selChar) {
    return (
      <CharacterDetail
        character={selChar}
        allCharacters={chars}
        onBack={() => setSelChar(null)}
        onNavigate={setSelChar}
      />
    );
  }

  const upl = [...new Set(filtered.map((c) => (c.player as any)?.id))].length;

  return (
    <div className={styles.content}>
      <div className={styles.contentTop}>
        <div>
          <div className={styles.contentTitle}>
            {selVer === "all"
              ? "Tous les personnages"
              : versions.find((v) => v.id === selVer)?.label || selVer}
          </div>
          <div className={styles.contentSub}>
            {filtered.length} personnage{filtered.length !== 1 ? "s" : ""} —{" "}
            {upl} joueur{upl !== 1 ? "s" : ""}
          </div>
        </div>
        {isAdmin && (
          <a
            href={`/admin?token=${searchParams.get("token") || ""}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 500,
              background: "#1e1530",
              border: "0.5px solid #4c2d8a",
              borderRadius: 8,
              color: "#a78bfa",
              textDecoration: "none",
            }}
          >
            <i
              className="ti ti-settings"
              style={{ fontSize: 13 }}
              aria-hidden="true"
            />{" "}
            Admin
          </a>
        )}
      </div>

      <div className={styles.accentBar}>
        <div className={styles.accentDot} />
        <div className={styles.accentLine} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <i className="ti ti-ghost" aria-hidden="true" />
          Aucun personnage trouvé
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              onClick={() => setSelChar(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<{
    versions: Version[];
    players: Player[];
    characters: Character[];
  }>({ versions: [], players: [], characters: [] });
  const [selVer, setSelVer] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const r = await fetch(`/api/data?t=${Date.now()}`, { cache: "no-store" });
    const d = await r.json();
    setData(d);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, []);

  const counts: Record<string, number> = {};
  data.characters.forEach((c) => {
    counts[c.version_id] = (counts[c.version_id] || 0) + 1;
  });
  const totalRels = data.characters.reduce(
    (acc, c) => acc + (c.relations?.length || 0),
    0,
  );

  return (
    <div className={styles.root}>
      <NavBar
        totalChars={data.characters.length}
        totalPlayers={data.players.length}
        totalVersions={data.versions.length}
        query={query}
        onQueryChange={setQuery}
      />
      <div className={styles.body}>
        <Sidebar
          versions={data.versions}
          selected={selVer}
          counts={counts}
          totalChars={data.characters.length}
          totalPlayers={data.players.length}
          totalRels={totalRels}
          onSelect={setSelVer}
        />
        {loading ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4a4560",
              fontSize: 14,
            }}
          >
            Chargement...
          </div>
        ) : (
          <Suspense
            fallback={
              <div style={{ flex: 1, padding: 40, color: "#4a4560" }}>
                Chargement...
              </div>
            }
          >
            <WikiContent
              chars={data.characters}
              versions={data.versions}
              selVer={selVer}
              query={query}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
