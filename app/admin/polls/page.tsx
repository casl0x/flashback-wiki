import { PollManager } from "@/app/_composents/admin/PollManager";
import { PageHeader } from "@/app/_composents/admin/ui";

export default function AdminPolls() {
  return (
    <>
      <PageHeader
        title="Sondages"
        meta="Le sondage affiché s’affiche sur l’accueil du wiki ; tu peux le masquer à tout moment."
      />
      <PollManager />
    </>
  );
}
