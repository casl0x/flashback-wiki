import { cloudinaryUrl, initials } from "@/lib/cloudinary";
import type { FavoriteItem } from "@/lib/favorite-items";
import Image from "next/image";
import Link from "next/link";

/** Joueurs et personnages favoris, en deux listes (le champ `kind` les différencie). */
export function FavoritesGrid({ items }: { items: FavoriteItem[] }) {
  const characters = items.filter((i) => i.kind === "CHARACTER");
  const players = items.filter((i) => i.kind === "PLAYER");

  return (
    <div className="flex flex-col gap-5">
      {characters.length > 0 && <FavoriteGroup title="Personnages" items={characters} />}
      {players.length > 0 && <FavoriteGroup title="Joueurs" items={players} />}
    </div>
  );
}

function FavoriteGroup({ title, items }: { title: string; items: FavoriteItem[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-[#A3A8B3]">
        {title} ({items.length})
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
        {items.map((i) => (
          <Link
            key={`${i.kind}-${i.id}`}
            href={i.kind === "PLAYER" ? `/joueurs/${i.id}` : `/personnages/${i.id}`}
            className="relative flex h-40 flex-col justify-end overflow-hidden rounded-[10px] border border-[#23262D] bg-[#15171B] hover:border-[#3A3E47]"
          >
            {i.imageUrl ? (
              <Image
                src={cloudinaryUrl(i.imageUrl, "w_300,h_400,c_fill,g_face")}
                alt=""
                fill
                unoptimized
                sizes="200px"
                className="object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center text-[28px] font-bold text-[#6E7380]"
              >
                {initials(i.name)}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-[#0E0F12] from-10% to-transparent" />
            <span className="relative px-2.5 pb-2 text-[14px] font-bold text-[#ECECEE]">
              {i.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
