import { getVersionBands } from "@/lib/version-bands";
import ExploreVersionUI from "./ExploreVersionUI";

export default async function ExploreVersion() {
  const bands = await getVersionBands();
  return <ExploreVersionUI versions={bands} />;
}
