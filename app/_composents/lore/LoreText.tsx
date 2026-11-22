import { MentionText } from "@/app/_composents/MentionText";

type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] };

/** Découpe le Markdown léger en blocs : « ## sous-titre », « - liste », paragraphes. */
function parse(source: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join("\n") });
    para = [];
  };
  const flushList = () => {
    if (list?.length) blocks.push({ type: "ul", items: list });
    list = null;
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const heading = /^#{1,3}\s+(.+)$/.exec(line);
    const item = /^[-•]\s+(.+)$/.exec(line);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push({ type: "h", text: heading[1] });
    } else if (item) {
      flushPara();
      (list ??= []).push(item[1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

/**
 * Texte long de la page Lore. Aucun HTML brut : tout passe par React, la mise en
 * forme inline (gras, italique…) et les mentions @[Nom](id) par MentionText.
 */
export default function LoreText({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-3.5 text-[15px] leading-relaxed text-[#B7BBC6]">
      {parse(text).map((b, i) =>
        b.type === "h" ? (
          <h4
            key={i}
            className="m-0 mt-2 text-[13px] font-bold uppercase tracking-[0.18em] text-(--c)"
          >
            <MentionText text={b.text} />
          </h4>
        ) : b.type === "ul" ? (
          <ul key={i} className="m-0 flex list-disc flex-col gap-1.5 pl-5 marker:text-(--c)">
            {b.items.map((it, j) => (
              <li key={j}>
                <MentionText text={it} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="m-0 whitespace-pre-line">
            <MentionText text={b.text} />
          </p>
        ),
      )}
    </div>
  );
}
