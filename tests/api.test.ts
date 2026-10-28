import { expect, it } from "vitest";
import { POST } from "../apps/web/app/api/companies/[id]/model/route";
import { GET as exportModel } from "../apps/web/app/api/companies/[id]/export/route";
import { readJson } from "../apps/web/lib/api";
import { parseScenario, scenarioFromQuery } from "../apps/web/lib/scenario";
import { DEFAULT_ASSUMPTIONS } from "../packages/engine/src/index";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
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
