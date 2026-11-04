import { sourceValue } from "../../../../lib/provenance";
import { apiError, withCompany } from "../../../../lib/api";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withCompany((await params).id, (c) => {
    const p = new URL(request.url).searchParams,
      year = Number(p.get("year")),
      field = p.get("field");
    const ref = c.sources.find((s) => s.year === year && s.field === field);
    if (!ref) return apiError("Source not found", 404);
    return Response.json(
      {
        company: c.name,
        dataKind: c.dataKind,
        source: ref,
        value: sourceValue(c, ref.field, year),
        unit:
          ref.field === "shares"
            ? "shares"
            : ["promoterPct", "pledgedPct"].includes(ref.field)
              ? "percent"
              : "INR crore",
        notice:
          c.dataKind === "demo"
            ? "Synthetic reference ledger; no real filing exists for this fictional company."
            : "Inspect the original filing at the cited page.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
