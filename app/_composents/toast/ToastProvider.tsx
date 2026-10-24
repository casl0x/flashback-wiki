"use client";

import { toneStyle, type NotificationTone } from "@/lib/notification-kinds";
import { AlertTriangle, CheckCircle2, Info, Sparkles, X, XCircle } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type ToastTone = NotificationTone;

type ToastAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

export type ToastInput = {
  tone: ToastTone;
  title: string;
  text?: string;
  action?: ToastAction;
  duration?: number;
};

type ToastItem = ToastInput & { id: string };

type ToastFn = (input: ToastInput) => void;

const ToastContext = createContext<ToastFn | null>(null);

const TONE_ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
  live: Sparkles,
};

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 5000;

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans un ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastFn>((input) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { ...input, id }]);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:items-end">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(toast.duration ?? DEFAULT_DURATION);
  const startedAtRef = useRef(0);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const start = useCallback(() => {
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => onCloseRef.current(), Math.max(remainingRef.current, 0));
  }, []);

  const pause = useCallback(() => {
    clear();
    remainingRef.current -= Date.now() - startedAtRef.current;
  }, [clear]);

  useEffect(() => {
    start();
    return clear;
    // Lancé une seule fois au montage ; pause()/start() pilotent la suite via le survol.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = toneStyle(toast.tone);
  const Icon = TONE_ICONS[toast.tone];
  const isError = toast.tone === "error";
  const action = toast.action;
  const actionHref = action && "href" in action ? action.href : undefined;

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      onMouseEnter={pause}
      onMouseLeave={start}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5 shadow-2xl sm:w-[360px]"
      style={{ background: style.bg, borderColor: `${style.color}40` }}
    >
      <Icon className="mt-0.5 h-4.5 w-4.5 flex-none" style={{ color: style.color }} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#ECECEE]">{toast.title}</p>
        {toast.text && (
          <p className="mt-0.5 text-[12px] leading-snug text-[#C4C7CF]">{toast.text}</p>
        )}
        {action &&
          (actionHref ? (
            <Link
              href={actionHref}
              onClick={onClose}
              className="mt-1.5 inline-block text-[12px] font-semibold"
              style={{ color: style.color }}
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                if ("onClick" in action) action.onClick?.();
                onClose();
              }}
              className="mt-1.5 text-[12px] font-semibold"
              style={{ color: style.color }}
            >
              {action.label}
            </button>
          ))}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la notification"
        className="flex-none text-[#9AA0AA] hover:text-[#ECECEE]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
