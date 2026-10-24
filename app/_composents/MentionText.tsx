import { Character } from "@/lib/db";
import { MENTION_PATTERN } from "@/lib/utils";
import Link from "next/link";

type Props = {
  text: string;
  className?: string;
};

// Affiche un texte libre en transformant chaque mention @[Nom](id) en
// lien cliquable vers la fiche du personnage visé, le reste restant du
// texte brut (les retours à la ligne doivent être gérés par le parent,
// ex. via la classe whitespace-pre-line).
export function MentionText({ text, className }: Props) {
  const re = new RegExp(MENTION_PATTERN.source, "g");
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, nom, id] = match;
    nodes.push(
      <Link
        key={`${id}-${match.index}`}
        href={`/personnages/${id}`}
        className="text-accent hover:underline font-medium"
      >
        {nom}
      </Link>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <span className={className}>{nodes}</span>;
}

export function MentionTextarea({
  value,
  onChange,
  characters: _characters,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  characters: Character[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
