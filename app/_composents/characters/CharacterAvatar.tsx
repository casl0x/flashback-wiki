import { cloudinaryUrl, initials } from "@/lib/character-page";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Props = { nom: string; imageUrl: string | null; size: number; className?: string };

/** Photo ronde du perso (Cloudinary), ou ses initiales s'il n'en a pas. */
export default function CharacterAvatar({ nom, imageUrl, size, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex flex-none items-center justify-center overflow-hidden rounded-full bg-[#2B2E35] font-bold text-[#C4C7CF]",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size / 3.2) }}
    >
      {imageUrl ? (
        <Image
          src={cloudinaryUrl(imageUrl, `w_${size * 2},h_${size * 2},c_fill,g_face`)}
          alt=""
          fill
          unoptimized
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        initials(nom)
      )}
    </span>
  );
}
