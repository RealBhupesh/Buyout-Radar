import { expect, it } from "vitest";
import {
  DEFAULT_ASSUMPTIONS,
  runLbo,
  stressTest,
  validateFinancials,
} from "../packages/engine/src/index";
import { base } from "./fixtures";
it("withholds IRR and MOIC when interim funding is missing", () => {
  const m = runLbo(base, [], { ...DEFAULT_ASSUMPTIONS, capexRate: 0.8 });
  expect(m.investable).toBe(false);
  expect(m.irr).toBeNull();
  expect(m.moic).toBeNull();
});
it("accounts for limited liability separately from deleveraging", () => {
  const m = runLbo(base, [], {
    ...DEFAULT_ASSUMPTIONS,
    exitMultiple: 0,
    cashSweep: 0,
    amortizationRate: 0,
    capexRate: 0.15,
  });
  expect(m.bridge).toHaveProperty("equityFloor");
  expect(
    m.bridge.growth +
      m.bridge.multiple +
      m.bridge.deleveraging +
      m.bridge.fees +
      m.bridge.equityFloor,
  ).toBeCloseTo(m.exitEquity - m.sponsorEquity, 8);
});
it("rejects extreme multiples before arithmetic overflows", () => {
  expect(() =>
    runLbo(base, [], { ...DEFAULT_ASSUMPTIONS, entryMultiple: 1e308 }),
  ).toThrow();
});
it("stress handles a high normalized margin without an irrelevant second model", () => {
  expect(() =>
    stressTest({ ...base, ebitda: 800 }, [], {
      ...DEFAULT_ASSUMPTIONS,
      marginExpansion: -0.8,
      holdYears: 10,
    }),
  ).not.toThrow();
});
it("rejects negative working-capital balances in historical statements", () => {
  const years = Array.from({ length: 5 }, (_, i) => ({
    ...base,
    year: 2022 + i,
    inventory: -10,
  }));
  expect(validateFinancials(years).length).toBeGreaterThan(0);
});
