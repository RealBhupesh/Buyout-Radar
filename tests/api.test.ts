import { afterEach, expect, it, vi } from "vitest";
import { POST } from "../apps/web/app/api/companies/[id]/model/route";
import { GET as exportModel } from "../apps/web/app/api/companies/[id]/export/route";
import { GET as listCompanies } from "../apps/web/app/api/companies/route";
import { GET as health } from "../apps/web/app/api/health/route";
import { GET as source } from "../apps/web/app/api/sources/[id]/route";
import { readJson } from "../apps/web/lib/api";
import { parseScenario, scenarioFromQuery } from "../apps/web/lib/scenario";
import { DEFAULT_ASSUMPTIONS } from "../packages/engine/src/index";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("reports database outages consistently and recovers on a fresh read", async () => {
  vi.stubEnv("DATA_MODE", "supabase");
  vi.stubEnv("SUPABASE_URL", "https://research.example");
  vi.stubEnv("SUPABASE_ANON_KEY", "test-key");
  let available = false;
  const fetch = vi.fn(async () =>
    available
      ? new Response(null, { status: 200 })
      : Response.json(
          { message: "Internal upstream error details" },
          { status: 403 },
        ),
  );
  vi.stubGlobal("fetch", fetch);
  const request = new Request("http://localhost/api", {
    method: "POST",
    body: "{}",
  });
  const id = context("demo-01");
  for (const read of [
    listCompanies,
    () => POST(request, id),
    () => exportModel(request, id),
    () => source(request, id),
  ]) {
    const response = await read();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "Research data unavailable",
    });
  }
  const unavailable = await health();
  expect(unavailable.status).toBe(503);
  expect(await unavailable.json()).toMatchObject({
    status: "unavailable",
    dataMode: "supabase",
  });
  available = true;
  expect((await health()).status).toBe(200);
  expect(fetch.mock.calls.at(-1)).toEqual([
    expect.stringContaining("/rest/v1/companies"),
    expect.objectContaining({
      method: "HEAD",
      signal: expect.any(AbortSignal),
    }),
  ]);
});
it("models a valid company without credentials and tags the data kind", async () => {
  const r = await POST(
    new Request("http://localhost/api/model", {
      method: "POST",
      body: JSON.stringify({ growthRate: 0.1 }),
    }),
    context("demo-01"),
  );
  expect(r.status).toBe(200);
  const body = await r.json();
  expect(body.dataKind).toBe("demo");
  expect(body.model.investable).toBe(true);
  expect(body.assumptions.growthRate).toBe(0.1);
});
it("rejects inherited property names and malformed assumptions", () => {
  expect(() => parseScenario({ toString: 1 }, DEFAULT_ASSUMPTIONS)).toThrow(
    /unknown/i,
  );
  expect(
    scenarioFromQuery('{"growthRate":"20%"}', { ...DEFAULT_ASSUMPTIONS }).error,
  ).not.toBeNull();
});
it("caps streamed bodies even when content-length is absent", async () => {
  await expect(
    readJson(
      new Request("http://localhost", {
        method: "POST",
        body: '{"large":"' + "x".repeat(10000) + '"}',
      }),
    ),
  ).rejects.toThrow(/large/i);
});
it("returns honest not-found and incomplete-data responses", async () => {
  expect(
    (
      await POST(
        new Request("http://localhost", { method: "POST", body: "{}" }),
        context("missing"),
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await exportModel(
        new Request("http://localhost/export"),
        context("demo-18"),
      )
    ).status,
  ).toBe(422);
});
