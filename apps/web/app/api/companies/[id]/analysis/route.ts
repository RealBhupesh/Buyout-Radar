import { analyze } from "../../../../../lib/research";
import {
  requestAssumptions,
  apiError,
  withCompany,
} from "../../../../../lib/api";
import { diligencePack, parseDealTerms } from "../../../../../lib/diligence";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withCompany((await params).id, (c) => {
    if (analyze(c).issues.length)
      return apiError("Data incomplete: analysis is withheld", 422);
    try {
      const pack = diligencePack(
        c,
        requestAssumptions(request, c),
        parseDealTerms(new URL(request.url).searchParams),
      );
      return Response.json(
        { id: c.id, dataKind: c.dataKind, ...pack },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (e) {
      return apiError((e as Error).message);
    }
  });
}
