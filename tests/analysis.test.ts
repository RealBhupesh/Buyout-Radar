import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASSUMPTIONS,
  companyAssumptions,
  ebitdaHeadroom,
  exitYearReturns,
  impliedEntryMultiple,
  lboFitScore,
  maxEntryPrice,
  projectCashFlows,
  qualityMetrics,
  runCases,
  runLbo,
  stressTest,
  takePrivate,
} from "../packages/engine/src/index";
import { DEMO_COMPANIES } from "../apps/web/lib/demo";
import { analyze } from "../apps/web/lib/research";
import { diligencePack, parseDealTerms } from "../apps/web/lib/diligence";
import { GET as analysis } from "../apps/web/app/api/companies/[id]/analysis/route";
import { GET as listCompanies } from "../apps/web/app/api/companies/route";
import { base } from "./fixtures";

const a = DEFAULT_ASSUMPTIONS;
const history = Array.from({ length: 5 }, (_, i) => ({
  ...base,
  year: 2022 + i,
  revenue: 1000 * 1.1 ** i,
  ebitda: 200 * 1.1 ** i,
}));

describe("returns analytics", () => {
  it("matches the engine at the chosen hold and holds the plan fixed for earlier exits", () => {
    const m = runLbo(base, [], a),
      exits = exitYearReturns(base, [], a);
    expect(exits).toHaveLength(a.holdYears);
    expect(exits.at(-1)!.irr).toBeCloseTo(m.irr!, 12);
    expect(exits.at(-1)!.moic).toBeCloseTo(m.moic!, 12);
    const p = m.projections[1];
    expect(exits[1].exitEquity).toBeCloseTo(
      p.ebitda * a.exitMultiple - p.closingDebt + p.cash,
      8,
    );
    expect(exits[1].irr).toBeCloseTo(
      Math.sqrt(exits[1].exitEquity / m.sponsorEquity) - 1,
      12,
    );
  });
  it("withholds every exit from the first unfunded year onward", () => {
    const exits = exitYearReturns(base, [], { ...a, capexRate: 0.8 });
    expect(exits.every((e) => e.irr === null && e.moic === null)).toBe(true);
  });
  it("solves the entry price that earns exactly the hurdle", () => {
    for (const target of [0.15, 0.2, 0.3]) {
      const price = maxEntryPrice(base, [], a, target)!;
      const m = runLbo(base, [], { ...a, entryMultiple: price.entryMultiple });
      expect(m.irr).toBeCloseTo(target, 10);
      expect(m.entryEV).toBeCloseTo(price.entryEV, 8);
      expect(m.purchaseEquity).toBeCloseTo(price.equityValue, 8);
    }
    const at = runLbo(base, [], a).irr!;
    expect(maxEntryPrice(base, [], a, at)!.headroom).toBeCloseTo(0, 10);
    expect(maxEntryPrice(base, [], { ...a, capexRate: 0.8 })).toBeNull();
  });
  it("finds the EBITDA shortfall at which each protection gives way", () => {
    const h = ebitdaHeadroom(base, [], a);
    for (const shock of [h.funding!, h.coverage!]) {
      expect(shock).toBeGreaterThan(0);
      expect(shock).toBeLessThan(0.99);
    }
    expect(stressTest(base, [], a, h.funding! - 1e-6).fundingGap).toBe(0);
    expect(
      stressTest(base, [], a, h.funding! + 1e-6).fundingGap,
    ).toBeGreaterThan(0);
    expect(stressTest(base, [], a, h.coverage! - 1e-6).firstBreach).toBeNull();
    expect(
      stressTest(base, [], a, h.coverage! + 1e-6).firstBreach,
    ).not.toBeNull();
    expect(h.capital!).toBeLessThanOrEqual(h.funding!);
    // A shrinking margin breaches the floor before any shock is applied.
    expect(
      ebitdaHeadroom(base, [], { ...a, marginExpansion: -0.1 }).coverage,
    ).toBeNull();
  });
  it("keeps the default stress identical to an explicit 20% shock and validates the shock", () => {
    expect(stressTest(base, [], a)).toEqual(stressTest(base, [], a, 0.2));
    const none = stressTest(base, [], a, 0),
      m = runLbo(base, [], a);
    expect(none.years.map((y) => y.debt)).toEqual(
      m.projections.map((p) => p.closingDebt),
    );
    expect(() => stressTest(base, [], a, 1)).toThrow();
    expect(() => stressTest(base, [], a, -0.1)).toThrow();
  });
  it("withholds capital headroom when the plan has nonpositive EBITDA", () => {
    const distressed = {
      ...a,
      growthRate: -0.7,
      marginExpansion: -0.21,
      workingCapitalRate: 0.8,
      capexRate: 0,
      leverage: 0,
      entryMultiple: 1,
    };
    const model = runLbo(base, [], distressed);
    expect(model.fundingGap).toBe(0);
    expect(model.investable).toBe(false);
    expect(ebitdaHeadroom(base, [], distressed).capital).toBeNull();
  });
  it("reports leverage and debt service cover on every forecast year", () => {
    const m = runLbo(base, [], a);
    for (const p of m.projections) {
      expect(p.netLeverage).toBeCloseTo(
        (p.closingDebt - p.cash) / p.ebitda,
        12,
      );
      expect(p.dscr).toBeCloseTo(
        (p.ebitda - p.tax - p.capex - p.deltaWC) / (p.interest + p.mandatory),
        12,
      );
    }
    const unlevered = projectCashFlows(base, 200, 0, a);
    expect(unlevered.every((p) => p.dscr === null)).toBe(true);
  });
  it("weights cases on multiples and carries failed cases as total losses", () => {
    const r = runCases(base, [], a, [
      { name: "Base", probability: 0.5, overrides: {} },
      { name: "Up", probability: 0.3, overrides: { exitMultiple: 10 } },
      { name: "Bust", probability: 0.2, overrides: { capexRate: 0.8 } },
    ]);
    const [b, u, bust] = r.cases;
    expect(bust.investable).toBe(false);
    expect(r.expectedMoic).toBeCloseTo(0.5 * b.moic! + 0.3 * u.moic!, 12);
    expect(r.expectedIrr).toBeCloseTo(r.expectedMoic! ** 0.2 - 1, 12);
    expect(r.lossProbability).toBeCloseTo(0.2, 12);
    const unweighted = runCases(base, [], a, [
      { name: "Base", overrides: {} },
      { name: "Invalid", overrides: { holdYears: 2.5 } },
    ]);
    expect(unweighted.expectedMoic).toBeNull();
    expect(unweighted.cases[1].error).toMatch(/hold/i);
    expect(() =>
      runCases(base, [], a, [
        { name: "A", overrides: {} },
        { name: "A", overrides: {} },
      ]),
    ).toThrow(/unique/i);
  });
});

describe("take-private structuring", () => {
  const target = {
    marketCap: 1000,
    promoterPct: 55,
    pledgedPct: 0,
    debt: 100,
    cash: 50,
    ebitda: 150,
    premium: 0.2,
  };
  it("prices the whole company at market plus the premium", () => {
    const d = takePrivate({ ...target, shares: 5e7 });
    expect(d.equityValue).toBe(1200);
    expect(d.enterpriseValue).toBe(1250);
    expect(d.entryMultiple).toBeCloseTo(1250 / 150, 12);
    expect(d.offerPricePerShare).toBeCloseTo(240, 10);
    expect(impliedEntryMultiple(target, 0)).toBeCloseTo(7, 12);
    expect(() => impliedEntryMultiple({ ...target, ebitda: 0 }, 0.2)).toThrow();
  });
  it("sizes the open offer and the stake range around tender outcomes", () => {
    const d = takePrivate({ ...target, acceptance: 0.5 });
    expect(d.openOffer).toMatchObject({ required: true, sizePct: 26 });
    expect(d.stakePct).toEqual({ minimum: 55, expected: 68, maximum: 81 });
    expect(d.cost.expected).toBeCloseTo(1200 * 0.68, 10);
    expect(d.openOffer.maximumCost).toBeCloseTo(1200 * 0.26, 10);
    expect(d.control).toBe(true);
    expect(d.delisting).toMatchObject({ reached: false, additionalPct: 22 });
    expect(d.delisting.shareOfRemainingPublic).toBeCloseTo(22 / 32, 12);
    expect(d.flags.map((f) => f.code)).toEqual([
      "open-offer",
      "listed-minorities",
    ]);
  });
  it("flags a public-float breach between 75% and the delisting threshold", () => {
    const d = takePrivate(target);
    expect(d.nonPublicPct).toBe(81);
    expect(d.flags.map((f) => f.code)).toContain("public-float-breach");
  });
  it("caps the open offer at the public float and recognises a delisting", () => {
    const d = takePrivate({ ...target, promoterPct: 80 });
    expect(d.openOffer.sizePct).toBe(20);
    expect(d.nonPublicPct).toBe(100);
    expect(d.delisting.reached).toBe(true);
    expect(d.flags.map((f) => f.code)).toEqual(["open-offer"]);
  });
  it("counts retained promoters as non-public and flags minority stakes and pledges", () => {
    const d = takePrivate({
      ...target,
      promoterStakeSold: 0.4,
      acceptance: 0,
      pledgedPct: 10,
      premium: -0.1,
    });
    expect(d.promoterBlockPct).toBeCloseTo(22, 12);
    expect(d.retainedPromoterPct).toBeCloseTo(33, 12);
    expect(d.nonPublicPct).toBeCloseTo(55, 12);
    expect(d.control).toBe(false);
    expect(d.flags.map((f) => f.code)).toEqual([
      "below-market",
      "open-offer",
      "no-control",
      "listed-minorities",
      "pledge-release",
    ]);
    expect(() => takePrivate({ ...target, acceptance: 1.2 })).toThrow();
    expect(() => takePrivate({ ...target, promoterPct: 120 })).toThrow();
  });
  it("excludes retained promoter shares from the buyer's modeled delisting threshold", () => {
    const d = takePrivate({
      ...target,
      promoterPct: 70,
      promoterStakeSold: 0.5,
    });
    expect(d.stakePct.expected).toBe(61);
    expect(d.nonPublicPct).toBe(96);
    expect(d.delisting).toMatchObject({ reached: false, additionalPct: 29 });
    expect(d.flags.map((f) => f.code)).toContain("public-float-breach");
    expect(
      takePrivate({ ...target, promoterPct: 50, acceptance: 0 }).control,
    ).toBe(false);
  });
});

describe("historical quality", () => {
  it("measures growth, stability and returns from reported statements", () => {
    const q = qualityMetrics(history);
    expect(q.revenueCagr).toBeCloseTo(0.1, 12);
    expect(q.averageMargin).toBeCloseTo(0.2, 12);
    expect(q.marginVolatility).toBeCloseTo(0, 12);
    const last = history.at(-1)!;
    expect(q.roce).toBeCloseTo((last.ebitda - 25) / 600, 12);
    expect(q.netDebtToEbitda).toBeCloseTo(50 / last.ebitda, 12);
    expect(q.revenueDeclines).toBe(0);
    expect(qualityMetrics([...history].reverse())).toEqual(q);
    expect(() => qualityMetrics([])).toThrow();
  });
  it("scores each factor between its thresholds and renormalizes missing data", () => {
    const q = qualityMetrics(history),
      fit = lboFitScore(q);
    expect(fit.coverage).toBe(1);
    expect(fit.score).toBeGreaterThanOrEqual(0);
    expect(fit.score).toBeLessThanOrEqual(100);
    expect(fit.components.reduce((s, c) => s + c.weight, 0)).toBe(100);
    const best = lboFitScore({
      ...q,
      cashConversion: 1,
      marginVolatility: 0,
      averageMargin: 0.3,
      revenueCagr: 0.2,
      capexIntensity: 0.01,
      netDebtToEbitda: -1,
      roce: 0.4,
    });
    expect(best.score).toBe(100);
    const partial = lboFitScore({ ...q, cashConversion: null });
    expect(partial.coverage).toBeCloseTo(0.75, 12);
    expect(partial.components[0].score).toBeNull();
    const single = lboFitScore(qualityMetrics([base]));
    expect(single.coverage).toBeLessThan(1);
    expect(single.score).not.toBeNull();
  });
});

describe("diligence pack", () => {
  it("reconciles across the fictional universe", () => {
    for (const c of DEMO_COMPANIES) {
      const research = analyze(c);
      if (research.issues.length) {
        expect(research.fitScore).toBeNull();
        continue;
      }
      const pack = diligencePack(c, companyAssumptions(c));
      expect(pack.exitYears.at(-1)!.irr).toBeCloseTo(pack.model.irr!, 10);
      expect(pack.cases.find((x) => x.name === "Base")!.irr).toBeCloseTo(
        pack.model.irr!,
        10,
      );
      expect(pack.market.impliedPremium).toBeCloseTo(
        research.impliedPremium!,
        12,
      );
      // Paying a 20% premium can never beat buying at the recorded market value.
      expect(pack.market.entryMultiple!).toBeGreaterThan(
        pack.assumptions.entryMultiple,
      );
      if (pack.market.irr !== null && pack.model.irr !== null)
        expect(pack.market.irr).toBeLessThan(pack.model.irr);
      expect(pack.structure!.offerPricePerShare).toBeNull();
      expect(pack.fit.score).toBe(research.fitScore);
    }
  });
  it("parses deal terms with defaults and bounds", () => {
    expect(parseDealTerms(new URLSearchParams())).toEqual({
      premium: 0.2,
      promoterStakeSold: 1,
      acceptance: 1,
    });
    expect(
      parseDealTerms(new URLSearchParams("premium=0.35&acceptance=0.5")),
    ).toMatchObject({ premium: 0.35, acceptance: 0.5 });
    expect(() => parseDealTerms(new URLSearchParams("premium=abc"))).toThrow();
    expect(() => parseDealTerms(new URLSearchParams("acceptance=2"))).toThrow();
  });
});

describe("analysis API", () => {
  const context = (id: string) => ({ params: Promise.resolve({ id }) });
  const get = (id: string, query = "") =>
    analysis(
      new Request(`http://localhost/api/companies/${id}/analysis${query}`),
      context(id),
    );
  it("serves the pack for a scenario and deal terms without caching", async () => {
    const scenario = encodeURIComponent(JSON.stringify({ exitMultiple: 9 }));
    const r = await get("demo-01", `?scenario=${scenario}&premium=0.3`);
    expect(r.status).toBe(200);
    expect(r.headers.get("Cache-Control")).toBe("no-store");
    const body = await r.json();
    expect(body).toMatchObject({ id: "demo-01", dataKind: "demo" });
    expect(body.assumptions.exitMultiple).toBe(9);
    expect(body.structure.premium).toBe(0.3);
    expect(body.exitYears).toHaveLength(5);
    expect(body.fit.components).toHaveLength(7);
  });
  it("refuses incomplete data, unknown companies and malformed terms", async () => {
    expect((await get("demo-18")).status).toBe(422);
    expect((await get("missing")).status).toBe(404);
    expect((await get("demo-01", "?premium=9")).status).toBe(400);
    expect((await get("demo-01", "?scenario=%7Bbad")).status).toBe(400);
  });
  it("adds screening fields to the company list", async () => {
    const { data } = await (await listCompanies()).json();
    const complete = data.find((r: { id: string }) => r.id === "demo-01");
    expect(complete.fitScore).toBeGreaterThan(0);
    expect(complete.impliedPremium).toBeCloseTo(
      analyze(DEMO_COMPANIES[0]).impliedPremium!,
      12,
    );
    expect(
      data.find((r: { id: string }) => r.id === "demo-18").fitScore,
    ).toBeNull();
  });
});
