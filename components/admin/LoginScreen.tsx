"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type Props = { onLogin: (token: string) => void };

const cls =
  "h-8 text-[12px] bg-[var(--elevated)] border-[var(--border-mid)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-0 placeholder:text-[var(--text-muted)]";

export function LoginScreen({ onLogin }: Props) {
  const [token, setToken] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(false);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (data.ok) {
      onLogin(token);
    } else {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--background)">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-(--accent) flex items-center justify-center text-white text-2xl mx-auto mb-4">
            ⚡
          </div>
          <h1 className="font-display text-xl font-bold tracking-widest text-(--text-primary)">
            FLASHBACK
          </h1>
          <p className="text-[12px] text-(--text-muted) mt-1">Administration</p>
        </div>
        <Card className="bg-(--card) border-(--border-mid)">
          <CardContent className="px-6 py-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-(--text-muted)">
                Token admin
              </label>
              <Input
                type="password"
                className={cls}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                suppressHydrationWarning
              />
            </div>
            {error && (
              <p className="text-[11px] text-[#f87171]">Token invalide.</p>
            )}
            <Button
              onClick={submit}
              disabled={loading || !token}
              className="w-full text-[13px] bg-(--accent) hover:bg-(--accent-hover) text-white border-0 cursor-pointer"
            >
              {loading ? "Vérification…" : "Accéder"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
