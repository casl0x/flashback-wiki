"use client";

import { PollAdmin } from "@/app/_composents/admin/PollAdmin";
import { PollList } from "@/app/_composents/admin/PollList";
import { useState } from "react";

export function PollManager() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <PollList refreshKey={refreshKey} />
      <PollAdmin onCreated={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}
