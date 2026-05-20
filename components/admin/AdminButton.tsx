"use client";

import {
  SignInButton,
  useAuth,
  useClerk,
  useOrganizationList,
} from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export default function AdminButton() {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const { userMemberships } = useOrganizationList({ userMemberships: true });
  const router = useRouter();

  const adminOrgId = process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID;
  const isAdmin = userMemberships?.data?.some(
    (m) => m.organization.id === adminOrgId,
  );

  if (!userId) {
    return (
      <SignInButton mode="modal">
        <Button variant={"outline"}>Se connecter</Button>
      </SignInButton>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {isAdmin && (
        <Button onClick={() => router.push("/admin")} variant={"secondary"}>
          <i className="ti ti-settings mr-2" />
          Administration
        </Button>
      )}
      <Button onClick={() => signOut()} variant={"outline"}>
        Se déconnecter
      </Button>
    </div>
  );
}
