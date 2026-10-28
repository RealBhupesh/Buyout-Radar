import { companyAssumptions, type Company } from "@buyout/engine";
import { parseScenario } from "./scenario";
export function requestAssumptions(request: Request, c: Company) {
  const raw = new URL(request.url).searchParams.get("scenario");
  if (!raw) return companyAssumptions(c);
  if (raw.length > 3000) throw new Error("Scenario exceeds 3000 characters");
  return parseScenario(JSON.parse(raw), companyAssumptions(c));
}
export async function readJson(request: Request, max = 8000): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("JSON body required");
  let total = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel();
        throw new Error("Request body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const part of chunks) {
    joined.set(part, offset);
    offset += part.length;
  }
  return JSON.parse(new TextDecoder().decode(joined));
}
export const apiError = (message: string, status = 400) =>
  Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
