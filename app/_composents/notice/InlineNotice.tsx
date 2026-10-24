import { toneStyle } from "@/lib/notification-kinds";
import { AlertTriangle, Info, XCircle } from "lucide-react";
import Link from "next/link";

export type InlineNoticeTone = "info" | "warning" | "error";

type InlineNoticeAction = { label: string; href: string } | { render: React.ReactNode };

const ICONS: Record<InlineNoticeTone, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

/** Bandeau de page (fiche, section…), distinct des toasts et de la cloche. */
export function InlineNotice({
  tone,
  children,
  action,
}: {
  tone: InlineNoticeTone;
  children: React.ReactNode;
  action?: InlineNoticeAction;
}) {
  const style = toneStyle(tone);
  const Icon = ICONS[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="flex items-start gap-3 rounded-[10px] border p-3.5 text-[13px] leading-snug text-[#D5D7DD]"
      style={{ background: style.bg, borderColor: `${style.color}40` }}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-none" style={{ color: style.color }} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
        <span>{children}</span>
        {action &&
          ("href" in action ? (
            <Link
              href={action.href}
              className="font-semibold underline"
              style={{ color: style.color }}
            >
              {action.label}
            </Link>
          ) : (
            action.render
          ))}
      </div>
    </div>
  );
}
