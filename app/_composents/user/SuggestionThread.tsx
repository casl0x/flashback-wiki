import { MentionText } from "@/app/_composents/MentionText";
import { cn } from "@/lib/utils";

export type ThreadMessage = {
  id: string;
  fromAdmin: boolean;
  text: string;
  createdAt: string;
};

/** Conversation admin ↔ auteur sur une proposition en attente. `viewer` : qui regarde. */
export function SuggestionThread({
  messages,
  viewer,
  authorName,
}: {
  messages: ThreadMessage[];
  viewer: "admin" | "author";
  authorName?: string;
}) {
  if (!messages.length) return null;
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label="Conversation">
      {messages.map((m) => {
        const mine = viewer === "admin" ? m.fromAdmin : !m.fromAdmin;
        const who =
          viewer === "admin"
            ? m.fromAdmin
              ? "Toi (modération)"
              : (authorName ?? "L’auteur")
            : m.fromAdmin
              ? "Modération"
              : "Toi";
        return (
          <li
            key={m.id}
            className={cn(
              "flex max-w-[92%] flex-col gap-0.5 rounded-lg px-3 py-2 text-[13px]",
              mine
                ? "self-end bg-[#13213A] text-[#D5E3FF]"
                : "self-start bg-[#22252B] text-[#ECECEE]",
            )}
          >
            <span className="text-[11px] font-bold text-[#9AA0AA]">
              {who} · {new Date(m.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="whitespace-pre-wrap break-words">
              <MentionText text={m.text} links />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
