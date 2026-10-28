import { getCompany } from "../../../../lib/repository";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const c = await getCompany((await params).id);
  if (!c) return Response.json({ error: "Company not found" }, { status: 404 });
  const p = new URL(request.url).searchParams,
    year = Number(p.get("year")),
    field = p.get("field");
  const ref = c.sources.find((s) => s.year === year && s.field === field);
  if (!ref)
    return Response.json({ error: "Source not found" }, { status: 404 });
  const financial = c.financials.find((f) => f.year === year)!;
  return Response.json({
    company: c.name,
    dataKind: c.dataKind,
    source: ref,
    value: financial[ref.field],
    unit: ref.field === "shares" ? "shares" : "INR crore",
    notice:
      c.dataKind === "demo"
        ? "Synthetic reference ledger; no real filing exists for this fictional company."
        : "Inspect the original filing at the cited page.",
  });
}
