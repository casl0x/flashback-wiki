import { getCharacterContributors } from "@/lib/public-profile";
import { profileHref } from "@/lib/utils";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SectionTitle from "./SectionTitle";

/** Bas de fiche : membres ayant enrichi ce perso (propositions acceptées, créations). */
export default async function CharacterContributors({
  characterId,
}: {
  characterId: string;
}) {
  const contributors = await getCharacterContributors(characterId);
  if (!contributors.length) return null;

  return (
    <section aria-labelledby="contributeurs-h" className="flex flex-col gap-3">
      <SectionTitle id="contributeurs-h">Contributeurs</SectionTitle>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {contributors.map((c) => (
          <li key={c.pseudo}>
            <Link
              href={profileHref(c.pseudo)}
              className="flex min-h-11 items-center gap-2 rounded-full border border-[#23262D] bg-[#15171B] py-1 pl-1 pr-3.5 text-[14px] font-semibold text-[#ECECEE] hover:border-[#3A3E47]"
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full bg-[#22252B]">
                {c.avatarUrl ? (
                  <Image
                    src={c.avatarUrl}
                    width={32}
                    height={32}
                    alt=""
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-[#9AA0AA]" />
                )}
              </span>
              {c.pseudo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
