import { describe, it, expect } from "vitest";
import { companyAssumptions } from "../packages/engine/src/index";
import { DEMO_COMPANIES } from "../apps/web/lib/demo";
import { DEFAULT_BUY_BOX, analyze, screen } from "../apps/web/lib/research";
import {
  KEYS,
  actionMatches,
  emptyWorkflow,
  isDate,
  isBuyBox,
  isScreens,
  isScenarios,
  isWorkflows,
  isAssumptions,
  localDate,
  scenarioAnalysis,
  comparisonIds,
  type SavedScenario,
} from "../apps/web/lib/workflow";
import { createBackup, parseBackup, mergeBackup } from "../apps/web/lib/backup";
import { csvCell, researchCsv } from "../apps/web/lib/research-export";
const c = DEMO_COMPANIES[0],
  a = companyAssumptions(c);
const scenario: SavedScenario = {
  id: "scenario-1",
  companyId: c.id,
  name: "Downside",
  assumptions: a,
  updatedAt: "2026-10-28T00:00:00Z",
};
describe("validated research records", () => {
  it("round trips all screen criteria and rejects invalid records", () => {
    const box = {
      ...DEFAULT_BUY_BOX,
      search: "SIM001",
      sector: "Industrials",
      sort: "conversion" as const,
      onlyQualified: true,
    };
    const screens = [{ id: "screen-1", name: "Cash screen", box }];
    expect(isScreens(JSON.parse(JSON.stringify(screens)))).toBe(true);
    expect(
      screen(DEMO_COMPANIES.map(analyze), screens[0].box).every(
        (r) => r.company.ticker === "SIM001",
      ),
    ).toBe(true);
    expect(isScreens([...screens, ...screens])).toBe(false);
    expect(isScreens([{ ...screens[0], name: "  " }])).toBe(false);
    expect(isBuyBox({ ...box, minCap: 30000, maxCap: 1000 })).toBe(false);
    expect(isBuyBox({ ...box, minIrr: NaN })).toBe(false);
  });
  it("requires all assumptions, rejects unknown fields and invalid scenario identities", () => {
    expect(isAssumptions(a)).toBe(true);
    const { taxRate, ...missing } = a;
    expect(isAssumptions(missing)).toBe(false);
    expect(isAssumptions({ ...a, unknown: 1 })).toBe(false);
    expect(
      isScenarios([{ ...scenario, assumptions: { ...a, leverage: -1 } }]),
    ).toBe(false);
    expect(isScenarios([{ ...scenario, id: "__proto__" }])).toBe(false);
    expect(isScenarios([scenario])).toBe(true);
  });
  it("validates tasks, stages and real calendar dates", () => {
    const w = {
      ...emptyWorkflow(c.id),
      tasks: [{ id: "task-1", text: "Review capex", done: false }],
      nextAction: { text: "Read filing", dueDate: "2028-02-29" },
    };
    expect(isWorkflows([w])).toBe(true);
    expect(isWorkflows([{ ...w, stage: "Unknown" }])).toBe(false);
    expect(isWorkflows([{ ...w, tasks: [...w.tasks, ...w.tasks] }])).toBe(
      false,
    );
    expect(isDate("2026-02-29")).toBe(false);
    expect(isDate("2026-13-01")).toBe(false);
    expect(isDate("")).toBe(true);
    expect(localDate(new Date(2026, 9, 28, 23, 59))).toBe("2026-10-28");
  });
  it("keeps undated actions out of due views and distinguishes today from overdue", () => {
    const w = {
      ...emptyWorkflow(c.id),
      nextAction: { text: "Read", dueDate: "2026-10-28" },
    };
    expect(actionMatches(w, "overdue", "2026-10-28")).toBe(false);
    expect(actionMatches(w, "upcoming", "2026-10-28")).toBe(true);
    expect(actionMatches(w, "overdue", "2026-10-29")).toBe(true);
    expect(
      actionMatches(
        { ...w, nextAction: { text: "Read", dueDate: "" } },
        "upcoming",
      ),
    ).toBe(false);
    expect(actionMatches(emptyWorkflow(c.id), "all")).toBe(true);
  });
});
describe("comparison and financial gates", () => {
  it("recalculates saved assumptions against current financials", () => {
    const initial = scenarioAnalysis(c, a);
    const changed = scenarioAnalysis(c, { ...a, growthRate: 0.15 });
    expect(changed.irr).not.toBe(initial.irr);
    const current = {
      ...c,
      financials: c.financials.map((f) => ({ ...f, revenue: f.revenue * 1.2 })),
    };
    expect(scenarioAnalysis(current, a).model?.entryEV).toBe(
      initial.model?.entryEV,
    );
    expect(scenarioAnalysis(current, a).irr).not.toBe(initial.irr);
  });
  it("withholds returns for incomplete, empty and unfunded cases", () => {
    expect(scenarioAnalysis(DEMO_COMPANIES[17], a)).toMatchObject({
      irr: null,
      moic: null,
      status: "Data incomplete",
    });
    expect(scenarioAnalysis({ ...c, financials: [] }, a)).toMatchObject({
      irr: null,
      moic: null,
      status: "Model unavailable",
    });
    expect(scenarioAnalysis(c, { ...a, capexRate: 0.8 })).toMatchObject({
      irr: null,
      moic: null,
      status: "Funding shortfall",
    });
    expect(scenarioAnalysis(c, { ...a, interestRate: -1 })).toMatchObject({
      irr: null,
      moic: null,
      status: "Model unavailable",
    });
  });
  it("deduplicates, caps selections and accepts repeated query params", () => {
    expect(comparisonIds(["a,b", "b,c,d,e"]).ids).toEqual(["a", "b", "c", "d"]);
    expect(comparisonIds(["a,b", "b,c,d,e"]).notices).toHaveLength(2);
    expect(comparisonIds(undefined).ids).toEqual([]);
  });
});
describe("CSV exports", () => {
  it("escapes separators, quotes, newlines, and formula payloads", () => {
    expect(csvCell('A,"B"\nC')).toBe('"A,""B""\nC"');
    for (const value of [
      "=SUM(A1)",
      "+cmd",
      "-cmd",
      "@cmd",
      " \t=cmd",
      "\r@cmd",
    ])
      expect(csvCell(value)).toMatch(/^"'/);
    expect(csvCell(-0.2)).toBe('"-0.2"');
  });
  it("exports all matching rows in order and never serializes invalid returns", () => {
    const rows = screen(DEMO_COMPANIES.map(analyze), DEFAULT_BUY_BOX);
    const csv = researchCsv(rows);
    expect(csv.split("\r\n")).toHaveLength(rows.length + 1);
    expect(csv).toContain("Market cap (INR crore)");
    expect(csv).toContain('"demo"');
    expect(csv.split("\r\n")[1]).toContain(rows[0].company.name);
    for (const r of rows.filter((r) => !r.valid))
      expect(
        csv.split("\r\n").find((l) => l.includes(`"${r.company.ticker}"`)),
      ).toContain('"Unavailable"');
  });
});
describe("backup validation and merging", () => {
  const note = `buyout:note:${c.id}:v1`;
  const values = {
    [KEYS.saved]: [c.id],
    [KEYS.box]: DEFAULT_BUY_BOX,
    [KEYS.screens]: [{ id: "screen-1", name: "Main", box: DEFAULT_BUY_BOX }],
    [KEYS.scenarios]: [scenario],
    [KEYS.workflows]: [emptyWorkflow(c.id)],
    [note]: "Private thesis",
  };
  it("round trips every feature including private notes", () => {
    expect(parseBackup(JSON.stringify(createBackup(values))).values).toEqual(
      values,
    );
  });
  it("rejects malformed, unsupported, oversized and invalid imports before merge", () => {
    expect(() => parseBackup("{")).toThrow(/JSON/);
    expect(() =>
      parseBackup(JSON.stringify({ ...createBackup(values), version: 2 })),
    ).toThrow(/Unsupported/);
    expect(() => parseBackup(" ".repeat(5 * 1024 * 1024 + 1))).toThrow(/limit/);
    expect(() =>
      parseBackup(JSON.stringify(createBackup({}).values)),
    ).toThrow();
    expect(() => createBackup({ ...values, unrelated: "no" })).toThrow(
      /unsupported/,
    );
    const bad = {
      ...createBackup(values),
      values: {
        [KEYS.scenarios]: [
          { ...scenario, assumptions: { ...a, leverage: -1 } },
        ],
      },
    };
    expect(() => parseBackup(JSON.stringify(bad))).toThrow(/Invalid backup/);
    expect(() =>
      parseBackup(
        '{"format":"buyout-radar","version":1,"exportedAt":"2026-10-28","values":{"__proto__":{}}}',
      ),
    ).toThrow(/Invalid backup/);
  });
  it("combines company lists and merges identities without overwriting conflicts by default", () => {
    const local = {
      ...values,
      [KEYS.saved]: ["demo-02"],
      [note]: "Local note",
      [KEYS.scenarios]: [{ ...scenario, name: "Local scenario" }],
    };
    const incoming = createBackup({
      ...values,
      [KEYS.scenarios]: [
        scenario,
        { ...scenario, id: "scenario-2", name: "New" },
      ],
    });
    const kept = mergeBackup(local, incoming);
    expect(kept.conflicts).toHaveLength(2);
    expect(kept.added).toBe(2);
    expect(kept.values[KEYS.saved]).toEqual(["demo-02", c.id]);
    expect(kept.values[note]).toBe("Local note");
    expect((kept.values[KEYS.scenarios] as SavedScenario[])[0].name).toBe(
      "Local scenario",
    );
    const replaced = mergeBackup(local, incoming, true);
    expect(replaced.values[note]).toBe("Private thesis");
    expect((replaced.values[KEYS.scenarios] as SavedScenario[])[0].name).toBe(
      "Downside",
    );
    expect(local[note]).toBe("Local note");
  });
});
