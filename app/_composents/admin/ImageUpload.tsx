"use client";

import { cloudinaryUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { CldUploadWidget } from "next-cloudinary";

type Props = {
  value: string | null;
  onChange: (publicId: string | null) => void;
  label: string;
  hint?: string;
  /** Transformation Cloudinary de l'aperçu. */
  preview?: string;
  aspect?: "square" | "wide" | "portrait";
};

/** Envoi d'image vers Cloudinary (même preset que l'ancien admin). */
export default function ImageUpload({ value, onChange, label, hint, preview = "w_480,h_480,c_fill,g_face", aspect = "square" }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
        onSuccess={(result) => {
          const info = result?.info;
          const publicId = typeof info === "object" && info && "public_id" in info ? String(info.public_id) : "";
          if (publicId) onChange(publicId);
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            aria-label={value ? `Changer : ${label}` : `Ajouter : ${label}`}
            className={cn(
              "relative flex w-full items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-[#3A3E47] bg-[#0B0C0F] text-center text-[13px] text-[#9AA0AA] hover:border-[#6E7380]",
              aspect === "wide" ? "aspect-[16/7]" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-square max-h-64",
            )}
          >
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cloudinaryUrl(value, preview)} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="px-4">
                Cliquer pour envoyer une image
                {hint && <span className="mt-1 block text-[12px]">{hint}</span>}
              </span>
            )}
          </button>
        )}
      </CldUploadWidget>
      {value && (
        <button type="button" onClick={() => onChange(null)} className="self-start text-[13px] text-[#FF8A8E] hover:underline">
          Retirer l’image
        </button>
      )}
    </div>
  );
}
