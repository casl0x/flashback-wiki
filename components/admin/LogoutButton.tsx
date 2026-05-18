"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <Button size={"sm"} variant={"secondary"} onClick={handleLogout}>
      Se déconnecter
    </Button>
  );
}
