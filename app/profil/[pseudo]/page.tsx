import { BadgePill } from "@/app/_composents/user/badges";
import {
  ProfileCharacters,
  ProfilePill,
  ProfileSectionTitle,
  Stat,
} from "@/app/_composents/user/ProfileParts";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { anton } from "@/lib/fonts";
import { youtubeThumbnail } from "@/lib/media-embed";
import { getPublicProfile } from "@/lib/public-profile";
import { cn } from "@/lib/utils";
import { ExternalLink, Film, User } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ pseudo: string }>;
};

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter / X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITCH: "Twitch",
  AUTRE: "Autre",
};

const TYPE_STYLE = {
  ARTISTE: { label: "Fan art", color: "#E5A3F0" },
  EDITEUR: { label: "Edit", color: "#8AB4FF" },
} as const;

// Selon le contexte, Next transmet le segment encodé ou non : on décode prudemment.
function decodePseudo(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pseudo } = await params;
  const p = await getPublicProfile(decodePseudo(pseudo));
  if (!p) return { title: "Profil introuvable – Flashback Wiki" };
  return {
    title: `${p.pseudo} – Flashback Wiki`,
    description: p.bio?.slice(0, 160) ?? undefined,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { pseudo } = await params;
  const p = await getPublicProfile(decodePseudo(pseudo));
  if (!p) notFound();

  const isCreator = p.creatorTypes.length > 0;

  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      {/* Bannière */}
      <div
        className="h-35 w-full sm:h-50"
        style={{
          background: isCreator
            ? "linear-gradient(135deg, #2F6FEB, #0E0F12)"
            : "repeating-linear-gradient(135deg, #1A1C21 0 14px, #17191D 14px 28px)",
        }}
      />

      <main className="mx-auto flex max-w-295 flex-col gap-7 px-4 pb-14 sm:px-5">
        {/* En-tête : identité */}
        <section className="-mt-14 flex flex-wrap items-end gap-4">
          <span className="flex h-22 w-22 flex-none items-center justify-center overflow-hidden rounded-full border-[5px] border-[#0E0F12] bg-[#22252B] sm:h-30 sm:w-30">
            {p.avatarUrl ? (
              <Image
                src={p.avatarUrl}
                width={120}
                height={120}
                alt=""
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-[#9AA0AA]" />
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2 pb-1">
            <h1
              className={cn(
                anton.className,
                "m-0 break-words text-[clamp(44px,6vw,72px)] uppercase leading-[0.95]",
              )}
            >
              {p.pseudo}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {isCreator && (
                <ProfilePill bg="#2A2113" color="#F6B26B">
                  Créateur
                </ProfilePill>
              )}
              {p.player && (
                <Link href={`/joueurs/${p.player.id}`}>
                  <ProfilePill bg="#1F1530" color="#C9A8FF">
                    Joueur : {p.player.pseudo} →
                  </ProfilePill>
                </Link>
              )}
            </div>
          </div>
        </section>

        <section
          aria-label="Informations publiques"
          className="flex flex-wrap gap-5"
        >
          <div className="flex min-w-65 flex-1 flex-col gap-2.5 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
            <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-[#A3A8B3]">
              Bio
            </p>
            <p
              className={cn(
                "m-0 whitespace-pre-line text-[17px]",
                p.bio ? "text-[#D5D7DD]" : "text-[#9AA0AA]",
              )}
            >
              {p.bio || "Pas encore de bio."}
            </p>
            {p.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.socialLinks.map((l, i) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#3A3E47] px-2.5 text-[12px] font-semibold text-[#C4C7CF] hover:border-[#6E7380] hover:text-[#ECECEE]"
                  >
                    {PLATFORM_LABELS[l.platform] ?? l.platform}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {p.stats && (
            <div className="flex min-w-65 flex-1 flex-wrap gap-6 rounded-xl border border-[#23262D] bg-[#15171B] p-5">
              <Stat value={p.stats.accepted} label="Ajouts validés" />
              <Stat value={p.stats.points} label="Points" />
              <Stat value={p.stats.creations} label="Créations" />
            </div>
          )}
        </section>

        {p.badges.length > 0 && (
          <section aria-labelledby="badges-h" className="flex flex-col gap-3">
            <ProfileSectionTitle id="badges-h">Badges</ProfileSectionTitle>
            <div className="flex flex-wrap gap-2">
              {p.badges.map((b) => (
                <BadgePill key={b} badgeKey={b} />
              ))}
            </div>
          </section>
        )}

        {p.player && (
          <ProfileCharacters playerId={p.player.id} characters={p.characters} />
        )}

        {isCreator && (
          <section aria-labelledby="creations-h" className="flex flex-col gap-4">
            <ProfileSectionTitle id="creations-h">Ses créations</ProfileSectionTitle>
            {p.posts.length === 0 ? (
              <p className="rounded-[10px] border border-dashed border-[#3A3E47] px-5 py-8 text-center text-[13px] text-[#9AA0AA]">
                Aucune création pour l&apos;instant.
              </p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
                {p.posts.map((post) => (
                  <PostTile key={post.id} post={post} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

type Post = NonNullable<Awaited<ReturnType<typeof getPublicProfile>>>["posts"][number];

function PostTile({ post }: { post: Post }) {
  const style = TYPE_STYLE[post.type];
  const thumb = post.type === "EDITEUR" ? youtubeThumbnail(post.linkUrl) : null;
  const alt = post.caption ?? style.label;

  const media = (
    <span className="relative block aspect-square w-full bg-[#22252B]">
      {post.imageUrl ? (
        <Image
          src={cloudinaryUrl(post.imageUrl, "w_400,c_fill")}
          alt={alt}
          fill
          unoptimized
          sizes="240px"
          className="object-cover"
        />
      ) : thumb ? (
        <Image src={thumb} alt={alt} fill unoptimized sizes="240px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          <Film className="h-6 w-6 text-[#8AB4FF]" />
        </span>
      )}
      <span
        className="absolute left-2 top-2 rounded px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#0E0F12]"
        style={{ background: style.color }}
      >
        {style.label}
      </span>
    </span>
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#23262D] bg-[#15171B] hover:border-[#3A3E47]">
      {post.linkUrl ? (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ouvrir sur ${post.platform ? PLATFORM_LABELS[post.platform] : "le site"}`}
        >
          {media}
        </a>
      ) : (
        media
      )}
      {(post.caption || post.characters.length > 0) && (
        <div className="flex flex-col gap-1 p-2.5 text-[12px]">
          {post.caption && <p className="m-0 text-[#D5D7DD]">{post.caption}</p>}
          {post.characters.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-1 text-[#9AA0AA]">
              avec
              {post.characters.map((c) => (
                <Link
                  key={c.id}
                  href={`/personnages/${c.id}`}
                  className="text-[#8AB4FF] hover:underline"
                >
                  {c.nom}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
