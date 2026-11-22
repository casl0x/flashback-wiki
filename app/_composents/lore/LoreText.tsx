import { MentionText } from "@/app/_composents/MentionText";

type Block =
  | { type: "p"; text: string }
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "hr" };

/**
 * Découpe le Markdown en blocs : titres (#, ##, ###), listes (- ou 1.), citations (>),
 * séparateur (---) et paragraphes (une ligne vide change de paragraphe).
 */
function parse(source: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: para.join("\n") });
    if (quote.length) blocks.push({ type: "quote", text: quote.join("\n") });
    if (list?.items.length)
      blocks.push({ type: list.ordered ? "ol" : "ul", items: list.items });
    para = [];
    quote = [];
    list = null;
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const bullet = /^[-*•]\s+(.+)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.+)$/.exec(line);
    const quoted = /^>\s?(.*)$/.exec(line);

    if (!line.trim()) {
      flush();
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flush();
      blocks.push({ type: "hr" });
    } else if (heading) {
      flush();
      blocks.push({
        type: "h",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2],
      });
    } else if (bullet || numbered) {
      const ordered = !!numbered;
      if (list && list.ordered !== ordered) flush();
      else if (!list) flush();
      (list ??= { ordered, items: [] }).items.push((bullet ?? numbered)![1]);
    } else if (quoted) {
      if (!quote.length) flush();
      quote.push(quoted[1]);
    } else {
      if (list || quote.length) flush();
      para.push(line);
    }
  }
  flush();
  return blocks;
}

// [texte](https://…) et `code`. Seuls http(s) sont acceptés pour les liens : pas de
// javascript:, et les mentions @[Nom](id) (sans schéma) ne sont pas confondues.
const INLINE = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|`([^`\n]+)`/g;

function Inline({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  const re = new RegExp(INLINE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(<MentionText key={`t${last}`} text={text.slice(last, m.index)} />);
    if (m[2]) {
      nodes.push(
        <a
          key={`l${m.index}`}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-(--c) underline underline-offset-2 hover:opacity-80"
        >
          <MentionText text={m[1]} />
        </a>,
      );
    } else {
      nodes.push(
        <code
          key={`c${m.index}`}
          className="rounded bg-[#16181d] px-1.5 py-0.5 font-mono text-[0.9em] text-[#ECECEE]"
        >
          {m[3]}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(<MentionText key={`t${last}`} text={text.slice(last)} />);
  return <>{nodes}</>;
}

const HEADING_CLS = {
  1: "mt-3 text-[20px] font-bold leading-snug text-[#ECECEE]",
  2: "mt-2 text-[13px] font-bold uppercase tracking-[0.18em] text-(--c)",
  3: "mt-1 text-[12px] font-bold uppercase tracking-[0.15em] text-[#8D93A0]",
} as const;

/**
 * Texte du Lore (résumés et textes) en Markdown. Aucun HTML brut : tout passe par
 * React ; la mise en forme inline (gras, italique…) et les mentions @[Nom](id) par
 * MentionText. La couleur d'accent vient de la variable CSS --c de la version.
 */
export default function LoreText({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-[#B7BBC6]">
      {parse(text).map((b, i) => {
        switch (b.type) {
          case "h": {
            const Tag = b.level === 1 ? "h4" : b.level === 2 ? "h5" : "h6";
            return (
              <Tag key={i} className={`m-0 ${HEADING_CLS[b.level]}`}>
                <Inline text={b.text} />
              </Tag>
            );
          }
          case "ul":
          case "ol": {
            const Tag = b.type;
            return (
              <Tag
                key={i}
                className={`m-0 flex flex-col gap-1.5 pl-5 marker:text-(--c) ${
                  b.type === "ul" ? "list-disc" : "list-decimal"
                }`}
              >
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "quote":
            return (
              <blockquote
                key={i}
                className="m-0 whitespace-pre-line border-l-2 border-(--c) pl-4 italic text-[#9DA2AE]"
              >
                <Inline text={b.text} />
              </blockquote>
            );
          case "hr":
            return <hr key={i} className="m-0 my-1 border-0 border-t border-[#2a2d35]" />;
          default:
            return (
              <p key={i} className="m-0 whitespace-pre-line">
                <Inline text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
