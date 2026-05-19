import { ExternalLink } from "lucide-react";

export default function SocialRow({
  href,
  icon,
  iconBg,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-elevated transition-colors rounded-lg mb-2"
    >
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </span>
      <span className="text-[13px] font-medium text-text-primary flex-1">
        {label}
      </span>
      <ExternalLink className="w-3 h-3 text-text-muted shrink-0" />
    </a>
  );
}
