import { describe, expect, it } from "vitest";
import {
  PILOT_COMPANIES,
  PILOT_DOCUMENTS,
  formatPilotCheckedDates,
  pilotFacts,
} from "../apps/web/lib/pilot";

describe("pilot source checked dates", () => {
  it("does not invent a date when no documents are available", () => {
    expect(formatPilotCheckedDates([])).toBe("Not recorded");
  });
  it.each([
    ["pilot-shanthi-gears", "28 October 2026"],
    ["pilot-racl-geartech", "28 October 2026"],
    ["pilot-mayur-uniquoters", "28 October 2026"],
    ["pilot-igarashi-motors", "13 November 2026"],
    ["pilot-sirca-paints", "13 November 2026"],
  ])("uses only %s's document dates", (id, expected) => {
    const company = PILOT_COMPANIES.find((c) => c.id === id)!;
    expect(
      formatPilotCheckedDates(pilotFacts(company).map((f) => f.source)),
    ).toBe(expected);
  });

  it("shows the directory's full range of document check dates", () => {
    expect(formatPilotCheckedDates(PILOT_DOCUMENTS)).toBe(
      "28 October - 13 November 2026",
    );
  });

  it("shows a range when a company's documents have different check dates", () => {
    const company = PILOT_COMPANIES.find((c) => c.id === "pilot-sirca-paints")!;
    const sources = pilotFacts(company).map((f, i) => ({
      ...f.source,
      checkedAt: i === 0 ? "2026-10-28" : "2026-11-13",
    }));
    sources.reverse();
    expect(formatPilotCheckedDates(sources)).toBe(
      "28 October - 13 November 2026",
    );
  });

  it("includes both years when a range crosses a year boundary", () => {
    expect(
      formatPilotCheckedDates([
        { checkedAt: "2027-01-02" },
        { checkedAt: "2026-12-31" },
      ]),
    ).toBe("31 December 2026 - 2 January 2027");
  });

  it("preserves the calendar date in timezones west of UTC", () => {
    const previous = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      expect(formatPilotCheckedDates([{ checkedAt: "2026-11-13" }])).toBe(
        "13 November 2026",
      );
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
});
