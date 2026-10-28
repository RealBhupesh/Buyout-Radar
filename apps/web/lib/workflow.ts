import {
  DEFAULT_ASSUMPTIONS,
  runLbo,
  type Assumptions,
  type Company,
} from "@buyout/engine";
import { analyze, type BuyBox } from "./research";
import { parseScenario } from "./scenario";

export const KEYS = {
  saved: "buyout:saved:v1",
  box: "buyout:buybox:v1",
  screens: "buyout:screens:v1",
  scenarios: "buyout:scenarios:v1",
  workflows: "buyout:workflows:v1",
} as const;
export const STAGES = [
  "Inbox",
  "Reviewing",
  "Diligence",
  "Passed",
  "Archived",
] as const;
export type Stage = (typeof STAGES)[number];
export interface SavedScreen {
  id: string;
  name: string;
  box: BuyBox;
}
export interface SavedScenario {
  id: string;
  companyId: string;
  name: string;
  assumptions: Assumptions;
  updatedAt: string;
}
export interface DiligenceTask {
  id: string;
  text: string;
  done: boolean;
}
export interface Workflow {
  companyId: string;
  stage: Stage;
  tasks: DiligenceTask[];
  nextAction: { text: string; dueDate: string } | null;
}
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const text = (x: unknown, max = 80): x is string =>
  typeof x === "string" && x.trim().length > 0 && x.length <= max;
const id = (x: unknown): x is string =>
  typeof x === "string" &&
  /^[a-zA-Z0-9_-]{1,100}$/.test(x) &&
  !["__proto__", "constructor", "prototype"].includes(x);
export function isBuyBox(x: unknown): x is BuyBox {
  if (!object(x)) return false;
  const b = x as unknown as BuyBox;
  return (
    typeof b.search === "string" &&
    b.search.length <= 500 &&
    typeof b.sector === "string" &&
    b.sector.length <= 100 &&
    typeof b.onlyQualified === "boolean" &&
    ["irr", "conversion", "marketCap"].includes(b.sort) &&
    [b.minIrr, b.minConversion, b.maxPledge, b.minCap, b.maxCap].every(
      Number.isFinite,
    ) &&
    b.minIrr >= 0 &&
    b.minIrr <= 0.5 &&
    b.minConversion >= 0 &&
    b.minConversion <= 1 &&
    b.maxPledge >= 0 &&
    b.maxPledge <= 100 &&
    b.minCap >= 0 &&
    b.maxCap <= 50000 &&
    b.minCap <= b.maxCap
  );
}
function uniqueArray<T>(
  x: unknown,
  validator: (v: unknown) => v is T,
  identity: (v: T) => string,
): x is T[] {
  return (
    Array.isArray(x) &&
    x.length <= 10000 &&
    x.every(validator) &&
    new Set(x.map(identity)).size === x.length
  );
}
export const isScreens = (x: unknown): x is SavedScreen[] =>
  uniqueArray(
    x,
    (v): v is SavedScreen =>
      object(v) && id(v.id) && text(v.name) && isBuyBox(v.box),
    (v) => v.id,
  );
export function isAssumptions(x: unknown): x is Assumptions {
  if (!object(x)) return false;
  const keys = Object.keys(DEFAULT_ASSUMPTIONS);
  if (
    Object.keys(x).length !== keys.length ||
    !keys.every((k) => Object.hasOwn(x, k))
  )
    return false;
  try {
    parseScenario(x, x as unknown as Assumptions);
    return true;
  } catch {
    return false;
  }
}
export const isScenarios = (x: unknown): x is SavedScenario[] =>
  uniqueArray(
    x,
    (v): v is SavedScenario =>
      object(v) &&
      id(v.id) &&
      id(v.companyId) &&
      text(v.name) &&
      isAssumptions(v.assumptions) &&
      typeof v.updatedAt === "string" &&
      Number.isFinite(Date.parse(v.updatedAt)),
    (v) => v.id,
  );
export function isDate(x: unknown): x is string {
  if (x === "") return true;
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const d = new Date(x + "T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === x;
}
export const isWorkflows = (x: unknown): x is Workflow[] =>
  uniqueArray(
    x,
    (v): v is Workflow =>
      object(v) &&
      id(v.companyId) &&
      STAGES.includes(v.stage as Stage) &&
      uniqueArray(
        v.tasks,
        (t): t is DiligenceTask =>
          object(t) &&
          id(t.id) &&
          text(t.text, 500) &&
          typeof t.done === "boolean",
        (t) => t.id,
      ) &&
      (v.nextAction === null ||
        (object(v.nextAction) &&
          text(v.nextAction.text, 500) &&
          isDate(v.nextAction.dueDate))),
    (v) => v.companyId,
  );
export function emptyWorkflow(companyId: string): Workflow {
  return { companyId, stage: "Inbox", tasks: [], nextAction: null };
}
export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function actionMatches(
  w: Workflow,
  filter: string,
  today = localDate(),
) {
  if (filter === "all") return true;
  const a = w.nextAction;
  if (!a?.dueDate) return false;
  return filter === "overdue" ? a.dueDate < today : a.dueDate >= today;
}
export function scenarioAnalysis(c: Company, assumptions: Assumptions) {
  const baseline = analyze(c);
  try {
    if (!c.financials.length) throw new Error("No financial history");
    const model = runLbo(c.financials.at(-1)!, c.adjustments, assumptions);
    const valid = baseline.issues.length === 0 && model.investable;
    const coverage = model.projections.flatMap((p) =>
      p.coverage === null ? [] : [p.coverage],
    );
    return {
      model,
      irr: valid ? model.irr : null,
      moic: valid ? model.moic : null,
      coverage: coverage.length ? Math.min(...coverage) : null,
      status: baseline.issues.length
        ? "Data incomplete"
        : !model.investable
          ? "Funding shortfall"
          : "Complete",
    };
  } catch {
    return {
      model: null,
      irr: null,
      moic: null,
      coverage: null,
      status: "Model unavailable",
    };
  }
}
export function comparisonIds(raw: string | string[] | undefined) {
  const pieces = (Array.isArray(raw) ? raw.join(",") : (raw ?? ""))
    .split(",")
    .filter(Boolean);
  const unique = [...new Set(pieces)];
  const notices: string[] = [];
  if (unique.length !== pieces.length)
    notices.push("Duplicate company selections were removed.");
  if (unique.length > 4)
    notices.push(
      "Compare supports four companies. The first four selections are shown.",
    );
  return { ids: unique.slice(0, 4), notices };
}
