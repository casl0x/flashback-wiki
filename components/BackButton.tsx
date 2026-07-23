"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary mb-3.5 transition-colors bg-transparent border-none cursor-pointer"
    >
      <ArrowLeft size={16} /> Retour
    </button>
  );
}
