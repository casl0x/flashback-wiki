"use client";

import { useUser } from "@clerk/nextjs";
import { CheckCircle2, Sparkles, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Notif = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

const ICONS: Record<string, { icon: typeof Sparkles; color: string }> = {
  suggestion_accepted: { icon: CheckCircle2, color: "text-green-400" },
  suggestion_rejected: { icon: XCircle, color: "text-red-400" },
  creator_role_approved: { icon: Sparkles, color: "text-accent-light" },
  creator_role_rejected: { icon: XCircle, color: "text-red-400" },
};

export function NotificationPopup() {
  const { isLoaded, isSignedIn } = useUser();
  const [queue, setQueue] = useState<Notif[]>([]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length) setQueue(d);
      });
  }, [isLoaded, isSignedIn]);

  function dismiss(id: string) {
    setQueue((q) => q.filter((n) => n.id !== id));
  }

  if (!queue.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-[min(340px,calc(100vw-2rem))] flex-col gap-2">
      {queue.map((n) => (
        <Toast key={n.id} notif={n} onClose={() => dismiss(n.id)} />
      ))}
    </div>
  );
}

function Toast({ notif, onClose }: { notif: Notif; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  const cfg = ICONS[notif.type] ?? {
    icon: Sparkles,
    color: "text-accent-light",
  };
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3 shadow-lg animate-in fade-in slide-in-from-bottom-4">
      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.color}`} />
      <p className="flex-1 text-[12px] text-text-secondary leading-snug">
        {notif.message}
      </p>
      <button
        onClick={onClose}
        className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
