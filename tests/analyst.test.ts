import { createBackup, parseBackup } from "../apps/web/lib/backup";
import { describe, expect, it } from "vitest";
import {
  researchWorkload,
  screenPilotResearch,
  FIELD_LABELS,
} from "../apps/web/lib/analyst";
import {
  PILOT_COMPANIES,
  PILOT_DOCUMENTS,
  pilotFacts,
  pilotGrowth,
  pilotCsv,
  validatePilot,
} from "../apps/web/lib/pilot";
import { emptyWorkflow, KEYS } from "../apps/web/lib/workflow";
import { DEFAULT_BUY_BOX, analyze } from "../apps/web/lib/research";
import { researchCsv } from "../apps/web/lib/research-export";
import { DEMO_COMPANIES } from "../apps/web/lib/demo";
describe("analyst workload", () => {
  it("counts only saved records, deduplicates identities and separates today from overdue", () => {
    const a = {
      ...emptyWorkflow("a"),
      stage: "Diligence" as const,
      nextAction: { text: "Read filing", dueDate: "2026-10-27" },
    };
    const b = {
      ...emptyWorkflow("b"),
      stage: "Reviewing" as const,
      nextAction: { text: "Review cash", dueDate: "2026-10-28" },
    };
    expect(
      researchWorkload(
        ["a", "b", "b", "c"],
        [
          a,
          b,
          {
            ...emptyWorkflow("unsaved"),
            nextAction: { text: "Ignore", dueDate: "2000-01-01" },
          },
        ],
        "2026-10-28",
      ),
    ).toMatchObject({
      saved: 3,
      reviewing: 2,
      overdue: 1,
      upcoming: 1,
      stages: { Inbox: 1, Diligence: 1, Reviewing: 1 },
    });
  });
  it("applies the same stage, search and qualification gates to real pilot research", () => {
    const c = PILOT_COMPANIES[0],
      w = { ...emptyWorkflow(c.id), stage: "Diligence" as const };
    expect(
      screenPilotResearch(
        PILOT_COMPANIES,
        [c.id],
        DEFAULT_BUY_BOX,
        [w],
        "Diligence",
        "all",
      ),
    ).toEqual([c]);
    expect(
      screenPilotResearch(
        PILOT_COMPANIES,
        [c.id],
        { ...DEFAULT_BUY_BOX, onlyQualified: true },
        [w],
        "All stages",
        "all",
      ),
    ).toEqual([]);
    expect(
      screenPilotResearch(
        PILOT_COMPANIES,
        [c.id],
        { ...DEFAULT_BUY_BOX, search: "Mayur" },
        [w],
        "All stages",
        "all",
      ),
    ).toEqual([]);
    expect(FIELD_LABELS.taxPaid).toBe("Cash taxes paid");
  });
});
describe("official filing pilot", () => {
  it("requires five years, official provenance, explicit units and an honest review gate", () => {
    expect(validatePilot(PILOT_COMPANIES, PILOT_DOCUMENTS)).toEqual([]);
    expect(
      validatePilot(
        [{ ...PILOT_COMPANIES[0], lboReady: true }],
        PILOT_DOCUMENTS,
      ),
    ).toContainEqual(expect.stringMatching(/review claim/));
    expect(
      validatePilot(
        [
          {
            ...PILOT_COMPANIES[0],
            history: PILOT_COMPANIES[0].history.slice(1),
          },
        ],
        PILOT_DOCUMENTS,
      ),
    ).toContainEqual(expect.stringMatching(/five-year/));
    expect(
      validatePilot(PILOT_COMPANIES, [
        { ...PILOT_DOCUMENTS[0], url: "https://example.com/invented.pdf" },
        ...PILOT_DOCUMENTS.slice(1),
      ]),
    ).toContainEqual(expect.stringMatching(/Unofficial/));
    expect(
      validatePilot(PILOT_COMPANIES, [
        { ...PILOT_DOCUMENTS[0], units: "USD" },
        ...PILOT_DOCUMENTS.slice(1),
      ]),
    ).toContainEqual(expect.stringMatching(/Unsupported units/));
  });
  it("converts lakh to crore once and preserves the reported precision", () => {
    const mayur = pilotFacts(PILOT_COMPANIES[2]);
    expect(mayur[0].revenue).toBeCloseTo(630.9525, 6);
    expect(mayur.at(-1)!.pat).toBeCloseTo(202.9697, 6);
    expect(pilotFacts(PILOT_COMPANIES[0]).at(-1)!.revenue).toBe(518.72);
    expect(pilotFacts(PILOT_COMPANIES[1])[2].pat).toBeCloseTo(39.8073, 6);
  });
  it("uses four annual intervals for a five-observation CAGR", () => {
    expect(pilotGrowth(PILOT_COMPANIES[0]).revenueCagr).toBeCloseTo(
      (518.72 / 337.07) ** 0.25 - 1,
      10,
    );
    expect(pilotGrowth(PILOT_COMPANIES[0]).revenueYoY).toBeLessThan(0);
  });
  it("exports every reported observation and withholds every transaction return", () => {
    const csv = pilotCsv(PILOT_COMPANIES),
      lines = csv.split("\r\n");
    expect(lines).toHaveLength(16);
    for (const line of lines.slice(1))
      expect(line).toMatch(/"Independent review pending","Unavailable"$/);
    expect(csv).toContain("https://www.shanthigears.com/");
    const mixed = researchCsv([analyze(DEMO_COMPANIES[0])], PILOT_COMPANIES);
    expect(mixed.split("\r\n")).toHaveLength(5);
    expect(mixed).toContain(
      '"official-filing-pilot","Transaction inputs incomplete"',
    );
  });
  it("backs up pilot notes and diligence without changing source review status", () => {
    const c = PILOT_COMPANIES[0],
      note = `buyout:note:${c.id}:v1`;
    const values = {
      [KEYS.saved]: [c.id],
      [KEYS.workflows]: [
        {
          ...emptyWorkflow(c.id),
          tasks: [{ id: "check-1", text: "Review source", done: true }],
        },
      ],
      [note]: "Private research",
    };
    expect(parseBackup(JSON.stringify(createBackup(values))).values).toEqual(
      values,
    );
    expect(c.lboReady).toBe(false);
    expect(c.reviewStatus).toBe("independent-review-pending");
  });
});
