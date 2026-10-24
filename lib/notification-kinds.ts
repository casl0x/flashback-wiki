import {
  Bell,
  CheckCircle2,
  HelpCircle,
  Link2,
  Mail,
  Megaphone,
  Sparkles,
  Trophy,
  XCircle,
  type LucideIcon,
} from "lucide-react";

// Tons partagés par la cloche, les toasts et les bandeaux (refonte notifications).
export type NotificationTone = "success" | "error" | "info" | "warning" | "live";

export type NotificationKind = {
  icon: LucideIcon;
  tone: NotificationTone;
  label: string;
  href: string | null;
};

const TONE_STYLES: Record<NotificationTone, { color: string; bg: string }> = {
  success: { color: "#6EE7A0", bg: "#11281C" },
  error: { color: "#FF8A8E", bg: "#2A1416" },
  info: { color: "#8AB4FF", bg: "#13213A" },
  warning: { color: "#F6B26B", bg: "#2A2113" },
  live: { color: "#C9A8FF", bg: "#1F1530" },
};

export function toneStyle(tone: NotificationTone) {
  return TONE_STYLES[tone];
}

/** Un type de `Notification.type` (ou "announcement") → icône, ton, libellé et lien. */
export const NOTIFICATION_KINDS: Record<string, NotificationKind> = {
  suggestion_accepted: {
    icon: CheckCircle2,
    tone: "success",
    label: "Proposition acceptée",
    href: "/profil#propositions",
  },
  suggestion_rejected: {
    icon: XCircle,
    tone: "error",
    label: "Proposition refusée",
    href: "/profil#propositions",
  },
  suggestion_question: {
    icon: HelpCircle,
    tone: "warning",
    label: "Question sur ta proposition",
    href: "/profil#propositions",
  },
  creator_role_approved: {
    icon: Sparkles,
    tone: "success",
    label: "Profil créateur validé",
    href: "/profil#createur",
  },
  creator_role_rejected: {
    icon: XCircle,
    tone: "error",
    label: "Profil créateur refusé",
    href: "/profil#createur",
  },
  creator_post_rejected: {
    icon: XCircle,
    tone: "error",
    label: "Création retirée",
    href: "/profil#createur",
  },
  player_link_accepted: {
    icon: Link2,
    tone: "success",
    label: "Compte lié",
    href: "/profil",
  },
  player_link_rejected: {
    icon: Link2,
    tone: "error",
    label: "Lien joueur refusé",
    href: "/profil",
  },
  badge_earned: {
    icon: Trophy,
    tone: "live",
    label: "Nouveau badge",
    href: "/profil",
  },
  admin_message: {
    icon: Mail,
    tone: "info",
    label: "Message",
    href: null,
  },
  announcement: {
    icon: Megaphone,
    tone: "info",
    label: "Annonce",
    href: null,
  },
};

const DEFAULT_KIND: NotificationKind = {
  icon: Bell,
  tone: "info",
  label: "Notification",
  href: null,
};

export function getNotificationKind(type: string): NotificationKind {
  return NOTIFICATION_KINDS[type] ?? DEFAULT_KIND;
}
