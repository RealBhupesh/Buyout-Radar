import { Radar } from "../components/radar";
import { getCompanies } from "../lib/repository";
export const dynamic = "force-dynamic";
export default async function Page() {
  return <Radar companies={await getCompanies()} />;
}
