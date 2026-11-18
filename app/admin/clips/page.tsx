import { PageHeader } from "@/app/_composents/admin/ui";
import { prisma } from "@/lib/db";
import { extractStreamUsername, detectStreamPlatform } from "@/lib/utils";
import ClipsBrowser from "./ClipsBrowser";

export const dynamic = "force-dynamic";

export default async function AdminClips() {
  const players = await prisma.player.findMany({
    where: { chaines: { isEmpty: false } },
    select: { pseudo: true, chaines: true },
    orderBy: { pseudo: "asc" },
  });

  const channels = players.flatMap((p) =>
    p.chaines
      .filter((u) => detectStreamPlatform(u) === "twitch")
      .map((u) => extractStreamUsername(u))
      .filter((l): l is string => !!l)
      .map((login) => ({ login, player: p.pseudo })),
  );

  return (
    <>
      <PageHeader title="Clips Twitch" meta="Recherche dans les chaînes des joueurs du wiki" />
      <ClipsBrowser channels={channels} />
    </>
  );
}
