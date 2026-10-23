"use client";

import { Button, Notice, TextInput } from "@/app/_composents/admin/ui";
import { addSiteUpdate } from "@/lib/admin/actions/moderation";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function SiteUpdateForm() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="flex flex-wrap items-end gap-2.5 rounded-[10px] border border-[#23262D] bg-[#15171B] p-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await addSiteUpdate(label, detail);
          if (!r.ok) return setError(r.error);
          setError(null);
          setLabel("");
          setDetail("");
          router.refresh();
        });
      }}
    >
      <label className="flex flex-[1_1_220px] flex-col gap-1 text-[13px] font-semibold text-[#C4C7CF]">
        Nouvelle mise à jour du site
        <TextInput
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex. Nouvelle page groupe"
        />
      </label>
      <label className="flex flex-[2_1_280px] flex-col gap-1 text-[13px] font-semibold text-[#C4C7CF]">
        Détail (optionnel)
        <TextInput value={detail} onChange={(e) => setDetail(e.target.value)} />
      </label>
      <Button
        type="submit"
        variant="primary"
        disabled={pending || !label.trim()}
      >
        Publier
      </Button>
      {error && (
        <div className="basis-full">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </form>
  );
}
