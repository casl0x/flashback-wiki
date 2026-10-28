import GroupePage, { groupeMetadata } from "@/app/_composents/groupes/GroupePage";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return groupeMetadata(slug, "ENTREPRISE");
}

export default async function Page({ params, searchParams }: Props) {
  const [{ slug }, { v }] = await Promise.all([params, searchParams]);
  return <GroupePage slug={slug} v={v} type="ENTREPRISE" />;
}
