"use client";

import { createCreatorPost } from "@/app/profil/actions";
import { CharacterCombobox } from "@/components/admin/CharacterCombobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Character } from "@/lib/db";
import { useUser } from "@clerk/nextjs";
import { Film, Sparkles, Upload, X } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PostType = "ARTISTE" | "EDITEUR";

const PLATFORMS = ["TWITTER", "TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITCH", "AUTRE"];
const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter / X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITCH: "Twitch",
  AUTRE: "Autre",
};

const EMPTY_STATE: {
  imageUrl: string;
  linkUrl: string;
  platform: string;
  caption: string;
  characterIds: string[];
} = {
  imageUrl: "",
  linkUrl: "",
  platform: "TIKTOK",
  caption: "",
  characterIds: [],
};

export function PublishCreatorPostButton({
  defaultType = "ARTISTE",
  allowedTypes = ["ARTISTE", "EDITEUR"],
  onPublished,
  className,
}: {
  defaultType?: PostType;
  allowedTypes?: PostType[];
  onPublished?: () => void;
  className?: string;
}) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const initialType = allowedTypes.includes(defaultType)
    ? defaultType
    : allowedTypes[0];

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PostType>(initialType);
  const [form, setForm] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterPicker, setCharacterPicker] = useState("");

  useEffect(() => {
    if (!open || characters.length) return;
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => setCharacters(d.characters ?? []));
  }, [open, characters.length]);

  function handleClick() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${pathname}`);
      return;
    }
    setOpen(true);
  }

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (!o) {
      setSent(false);
      setError(null);
      setForm(EMPTY_STATE);
      setType(initialType);
      setCharacterPicker("");
    }
  }

  function addCharacter(id: string) {
    setForm((p) =>
      p.characterIds.includes(id)
        ? p
        : { ...p, characterIds: [...p.characterIds, id] },
    );
    setCharacterPicker("");
  }

  function removeCharacter(id: string) {
    setForm((p) => ({
      ...p,
      characterIds: p.characterIds.filter((c) => c !== id),
    }));
  }

  async function submit() {
    setError(null);
    if (type === "ARTISTE" && !form.imageUrl) {
      setError("Ajoute une image avant de publier.");
      return;
    }
    if (type === "EDITEUR" && !form.linkUrl.trim()) {
      setError("Ajoute un lien vers ton edit avant de publier.");
      return;
    }

    setLoading(true);
    try {
      await createCreatorPost({
        type,
        imageUrl: type === "ARTISTE" ? form.imageUrl : undefined,
        linkUrl: form.linkUrl.trim() || undefined,
        platform: type === "EDITEUR" ? (form.platform as never) : undefined,
        caption: form.caption.trim() || undefined,
        characterIds: form.characterIds,
      });
      setSent(true);
      onPublished?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={handleClick} className={className}>
        <Upload className="h-3.5 w-3.5" />
        Publier
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-card border-border-mid max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[14px]">Publier une création</DialogTitle>
          </DialogHeader>

          {sent ? (
            <div className="py-6 text-center">
              <p className="text-[13px] text-text-secondary">
                Merci ! Ta publication est en ligne sur la page.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Type */}
              {allowedTypes.length > 1 && (
                <div className="flex gap-1.5">
                  {(
                    [
                      { key: "ARTISTE" as const, label: "Fan art", icon: Sparkles },
                      { key: "EDITEUR" as const, label: "Edit", icon: Film },
                    ] satisfies { key: PostType; label: string; icon: typeof Sparkles }[]
                  )
                    .filter(({ key }) => allowedTypes.includes(key))
                    .map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setType(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors ${
                          type === key
                            ? "border-accent/40 bg-accent/10 text-accent-light"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </button>
                    ))}
                </div>
              )}

              {type === "ARTISTE" ? (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-widest text-text-muted">
                    Image
                  </label>
                  <div className="flex items-center gap-2">
                    {form.imageUrl ? (
                      <img
                        src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_56,h_56,c_fill/${form.imageUrl}`}
                        alt="aperçu"
                        className="h-14 w-14 rounded-md object-cover border border-border"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-md border border-dashed border-border bg-elevated" />
                    )}
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
                      onSuccess={(result) => {
                        const info = result?.info;
                        const publicId =
                          typeof info === "object" && info && "public_id" in info
                            ? (info.public_id as string)
                            : "";
                        setForm((p) => ({ ...p, imageUrl: publicId }));
                      }}
                    >
                      {({ open: openWidget }) => (
                        <button
                          type="button"
                          onClick={() => openWidget()}
                          className="text-[11px] border border-border-mid text-text-secondary px-3 py-1.5 rounded-md hover:bg-elevated transition-colors"
                        >
                          {form.imageUrl ? "Changer l'image" : "Choisir une image"}
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted">
                      Plateforme
                    </label>
                    <select
                      value={form.platform}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, platform: e.target.value }))
                      }
                      className="rounded-md border border-border bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {PLATFORM_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest text-text-muted">
                      Lien vers l&apos;edit
                    </label>
                    <Input
                      type="url"
                      value={form.linkUrl}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, linkUrl: e.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted">
                  Personnages liés (optionnel)
                </label>
                {form.characterIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {form.characterIds.map((id) => {
                      const c = characters.find((ch) => ch.id === id);
                      return (
                        <span
                          key={id}
                          className="flex items-center gap-1 text-[11px] text-text-secondary border border-border bg-elevated rounded-md pl-2 pr-1 py-0.5"
                        >
                          {c?.nom ?? id}
                          <button
                            type="button"
                            onClick={() => removeCharacter(id)}
                            className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-border text-text-muted hover:text-text-primary transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <CharacterCombobox
                  characters={characters.filter(
                    (c) => !form.characterIds.includes(c.id),
                  )}
                  value={characterPicker}
                  onValueChange={addCharacter}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted">
                  Description (optionnel)
                </label>
                <textarea
                  className="h-16 resize-none rounded-md px-3 py-2 bg-input border border-border text-[13px]"
                  value={form.caption}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, caption: e.target.value }))
                  }
                  placeholder="Un mot sur ta création..."
                />
              </div>

              {error && <p className="text-[12px] text-red-400">{error}</p>}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="border-border-mid text-text-secondary cursor-pointer"
            >
              {sent ? "Fermer" : "Annuler"}
            </Button>
            {!sent && (
              <Button
                size="sm"
                onClick={submit}
                disabled={loading}
                className="bg-accent hover:bg-accent-hover text-white border-0 cursor-pointer"
              >
                {loading ? "…" : "Publier"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
