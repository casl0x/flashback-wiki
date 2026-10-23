import { redirect } from "next/navigation";

// Ancienne adresse : les propositions sont maintenant dans Modération.
export default function SuggestionsRedirect() {
  redirect("/admin/moderation?tab=propositions");
}
