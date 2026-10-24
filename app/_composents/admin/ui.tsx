// Briques visuelles de l'admin (refonte) : mêmes couleurs que les maquettes.
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const inputCls =
  "min-h-10 w-full rounded-lg border border-[#3A3E47] bg-[#0B0C0F] px-3 text-[14px] text-[#ECECEE] placeholder:text-[#6E7380] focus:border-[#2F6FEB] focus:outline-none";

export function PageHeader({
  title,
  back,
  meta,
  actions,
}: {
  title: ReactNode;
  back?: { href: string; label: string };
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="text-[13px] text-[#A3A8B3] hover:text-[#ECECEE]"
          >
            ← {back.label}
          </Link>
        )}
        <h1
          className={cn(
            anton.className,
            "m-0 text-[32px] uppercase leading-tight text-[#ECECEE] sm:text-[40px]",
          )}
        >
          {title}
        </h1>
        {meta && <div className="text-[12px] text-[#9AA0AA]">{meta}</div>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function Panel({
  legend,
  children,
  className,
  aside,
}: {
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[#23262D] bg-[#15171B] p-4 sm:p-4.5",
        className,
      )}
    >
      {(legend || aside) && (
        <div className="mb-3.5 flex items-center justify-between gap-3">
          {legend && (
            <h2 className="m-0 text-[12px] font-bold uppercase tracking-[0.12em] text-[#A3A8B3]">
              {legend}
            </h2>
          )}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-w-0 flex-col gap-1 text-[13px] font-semibold text-[#C4C7CF]",
        className,
      )}
    >
      {label}
      {children}
      {hint && (
        <span className="text-[12px] font-normal text-[#9AA0AA]">{hint}</span>
      )}
    </label>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input {...props} className={cn(inputCls, "font-normal", className)} />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(inputCls, "px-2.5 font-normal", className)}
    />
  );
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        inputCls,
        "min-h-24 resize-y py-2.5 font-normal leading-relaxed",
        className,
      )}
    />
  );
}

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[#2F6FEB] text-white hover:bg-[#2A63D4] border border-transparent",
  secondary:
    "border border-[#3A3E47] bg-transparent text-[#ECECEE] hover:bg-[#1F2228]",
  danger:
    "border border-[#5A2A2E] bg-transparent text-[#FF8A8E] hover:bg-[#2A1416]",
  ghost:
    "border border-transparent bg-transparent text-[#A3A8B3] hover:text-[#ECECEE]",
  success:
    "bg-[#1F8F55] text-white hover:bg-[#1A7A48] border border-transparent",
};

export function Button({
  variant = "secondary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-1 text-[14px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

export function ButtonLink({
  variant = "secondary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-1 text-[14px] font-bold transition-colors",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

/** Onglets sous forme de liens (l'onglet actif vit dans l'URL). */
export function LinkTabs({
  tabs,
}: {
  tabs: { href: string; label: string; count?: number; active: boolean }[];
}) {
  return (
    <nav
      aria-label="Onglets"
      className="flex flex-wrap gap-2 border-b border-[#23262D] pb-3.5"
    >
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-3.5 py-1 text-[14px] font-bold",
            t.active
              ? "border-[#ECECEE] bg-[#ECECEE] text-[#0E0F12]"
              : "border-[#3A3E47] text-[#C4C7CF] hover:border-[#6E7380]",
          )}
        >
          {t.label}
          {t.count != null && (
            <span className="font-medium opacity-80">· {t.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function Tag({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold",
        className,
      )}
      style={color ? { background: color, color: "#121212" } : undefined}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[#3A3E47] p-8 text-center text-[14px] text-[#9AA0AA]">
      {children}
    </div>
  );
}

/** Message de retour après une action (succès ou erreur). */
export function Notice({
  tone,
  children,
}: {
  tone: "ok" | "error";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "m-0 rounded-lg px-3 py-2 text-[13px]",
        tone === "ok"
          ? "bg-[#0F2218] text-[#7FF0B0]"
          : "bg-[#2A1416] text-[#FF9A9E]",
      )}
    >
      {children}
    </p>
  );
}

export const ETAT_LABELS = {
  EN_VIE: "En vie",
  MORT: "Mort",
  PARTI: "Parti",
  DISPARU: "Disparu",
  PRISON: "En prison",
} as const;

export const ETAT_COLORS = {
  EN_VIE: "#6EE7A0",
  MORT: "#FF8A8E",
  PARTI: "#C4C7CF",
  DISPARU: "#F6B26B",
  PRISON: "#8AB4FF",
} as const;
