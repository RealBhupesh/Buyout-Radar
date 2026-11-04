import { checkResearchDatabase, dataMode } from "../../../lib/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  let available = true;
  try {
    await checkResearchDatabase();
  } catch {
    available = false;
  }
  return Response.json(
    {
      status: available ? "ok" : "unavailable",
      version: "1.0.0",
      dataMode: dataMode(),
      aiConfigured: Boolean(process.env.GROQ_API_KEY),
      unit: "INR crore",
    },
    { status: available ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
