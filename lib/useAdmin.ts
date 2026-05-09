"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function useAdmin() {
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const verify = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const { ok } = await res.json();
      if (ok) {
        localStorage.setItem("admin_token", token);
        setIsAdmin(true);
      } else {
        localStorage.removeItem("admin_token");
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    const storedToken = localStorage.getItem("admin_token");
    const tokenToCheck = urlToken || storedToken;
    let cancelled = false;

    const run = async () => {
      if (tokenToCheck) {
        await verify(tokenToCheck);
      }

      if (!cancelled) {
        setChecking(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [searchParams, verify]);

  const adminFetch = useCallback((url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("admin_token") || "";
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
        ...(options.headers || {}),
      },
    });
  }, []);

  return { isAdmin, checking, adminFetch };
}
