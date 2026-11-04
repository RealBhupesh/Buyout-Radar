import { notFound } from "next/navigation";
import { ShanthiUnderwriting } from "../../../../components/shanthi-underwriting";
import { SHANTHI_ID } from "../../../../lib/shanthi-underwriting";

export const metadata = {
  title: "Shanthi Gears underwriting",
  description:
    "A retrospective, filing-backed FY2026 acquisition scenario for Shanthi Gears.",
};

export default async function UnderwritingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if ((await params).id !== SHANTHI_ID) notFound();
  return <ShanthiUnderwriting />;
}
