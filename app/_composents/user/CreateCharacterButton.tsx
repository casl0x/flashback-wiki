"use client";
import { SuggestButton } from "@/app/_composents/user/SuggestEditButton";
import { Plus } from "lucide-react";

export function CreateCharacterButton() {
  return (
    <SuggestButton
      mode="create"
      renderTrigger={(onClick) => (
        <button
          onClick={onClick}
          className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#3A3E47] px-3.5 text-[14px] font-bold text-[#ECECEE] hover:border-[#6E7380]"
        >
          <Plus className="h-3.5 w-3.5" />
          Proposer un personnage
        </button>
      )}
    />
  );
}
