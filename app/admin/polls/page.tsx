import { PageHeader } from "@/app/_composents/admin/ui";
import { PollAdmin } from "@/components/admin/PollAdmin";

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
