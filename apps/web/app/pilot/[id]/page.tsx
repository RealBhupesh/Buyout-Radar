import { notFound } from "next/navigation";
import { PILOT_COMPANIES } from "../../../lib/pilot";
import { PilotWorkspace } from "../../../components/pilot-workspace";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return {
    title:
      PILOT_COMPANIES.find((c) => c.id === id)?.name ??
      "Pilot company not found",
  };
}
export default async function PilotCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id,
    c = PILOT_COMPANIES.find((c) => c.id === id);
  if (!c) notFound();
  return <PilotWorkspace key={c.id} company={c} />;
}
