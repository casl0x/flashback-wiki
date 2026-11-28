import { SITE_URL } from "@/lib/site";
import { MENTION_PATTERN } from "@/lib/utils";
import Link from "next/link";

type Props = {
  text: string;
  className?: string;
  /** Rend les URL cliquables (notifications, annonces). Désactivé pour les descriptions. */
  links?: boolean;
};

// Mise en forme légère (style Markdown) : **gras**, *italique*,
// __souligné__, ~~barré~~. Les mentions @[Nom](id) restent des liens.
const TOKEN = new RegExp(
  [
    MENTION_PATTERN.source, // 1: nom, 2: id
    String.raw`\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*`, // 3: gras
    String.raw`__(?!\s)([\s\S]+?)(?<!\s)__`, // 4: souligné
    String.raw`~~(?!\s)([\s\S]+?)(?<!\s)~~`, // 5: barré
    String.raw`\*(?!\s)([^*\n]+?)(?<!\s)\*`, // 6: italique
  ].join("|"),
  "g",
);

// URL nue (http/https) : la ponctuation finale d'une phrase n'en fait pas partie.
const URL_SOURCE = String.raw`https?:\/\/[^\s<>()\[\]]+`;
const TOKEN_WITH_LINKS = new RegExp(`${TOKEN.source}|(${URL_SOURCE})`, "g");

function UrlLink({ url }: { url: string }) {
  const cls = "text-accent hover:underline font-medium break-all";
  // Lien vers le wiki lui-même : navigation interne, même onglet.
  if (url === SITE_URL || url.startsWith(`${SITE_URL}/`)) {
    return (
      <Link href={url.slice(SITE_URL.length) || "/"} className={cls}>
        {url}
      </Link>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" className={cls}>
      {url}
    </a>
  );
}

function render(text: string, links: boolean, depth = 0): React.ReactNode[] {
  const re = new RegExp((links ? TOKEN_WITH_LINKS : TOKEN).source, "g");
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const key = `${depth}-${match.index}`;
    const [, nom, id, bold, underline, strike, italic, rawUrl] = match;
    if (nom !== undefined) {
      nodes.push(
        <Link
          key={key}
          href={`/personnages/${id}`}
          className="text-accent hover:underline font-medium"
        >
          {nom}
        </Link>,
      );
    } else if (bold !== undefined) {
      nodes.push(
        <strong key={key} className="font-bold text-[#ECECEE]">
          {render(bold, links, depth + 1)}
        </strong>,
      );
    } else if (underline !== undefined) {
      nodes.push(<u key={key}>{render(underline, links, depth + 1)}</u>);
    } else if (strike !== undefined) {
      nodes.push(<s key={key}>{render(strike, links, depth + 1)}</s>);
    } else if (italic !== undefined) {
      nodes.push(<em key={key}>{render(italic, links, depth + 1)}</em>);
    } else if (rawUrl !== undefined) {
      const url = rawUrl.replace(/[.,;:!?»"'’]+$/, "");
      nodes.push(<UrlLink key={key} url={url} />);
      // La ponctuation retirée repart dans le texte qui suit.
      re.lastIndex = match.index + url.length;
      lastIndex = re.lastIndex;
      continue;
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

// Affiche un texte libre en transformant les mentions en liens et en
// appliquant la mise en forme légère. Les retours à la ligne doivent être
// gérés par le parent (ex. via la classe whitespace-pre-line / pre-wrap).
export function MentionText({ text, className, links = false }: Props) {
  return <span className={className}>{render(text, links, 0)}</span>;
}
