import { buildWorkbook } from "@buyout/excel";
import {
  requestAssumptions,
  apiError,
  withCompany,
} from "../../../../../lib/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withCompany((await params).id, async (c) => {
    try {
      const a = requestAssumptions(request, c);
      const buffer = await buildWorkbook(c, a);
      const filename = `${c.ticker.replace(/[^a-zA-Z0-9_-]/g, "")}-buyout.xlsx`;
      return new Response(buffer as BodyInit, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      return apiError((e as Error).message, c.qualityIssues.length ? 422 : 400);
    }
  });
}
