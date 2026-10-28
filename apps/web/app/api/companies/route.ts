import { getCompanies } from "../../../lib/repository";
import { analyze } from "../../../lib/research";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const rows = (await getCompanies()).map(analyze);
    return Response.json(
      {
        data: rows.map((r) => ({
          id: r.company.id,
          name: r.company.name,
          sector: r.company.sector,
          marketCap: r.company.marketCap,
          dataKind: r.company.dataKind,
          irr: r.irr,
          qualityIssues: r.issues,
          status: r.status,
          fundingGap: r.model?.fundingGap ?? null,
        })),
        count: rows.length,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Research data unavailable" },
      { status: 503 },
    );
  }
}
