import { PollAdmin } from "@/app/_composents/admin/PollAdmin";
import { PageHeader } from "@/app/_composents/admin/ui";

export default function AdminPolls() {
  return (
    <>
      <PageHeader
        title="Sondages"
        meta="Les sondages actifs s’affichent sur l’accueil du wiki."
      />
      <PollAdmin />
    </>
  );
}
