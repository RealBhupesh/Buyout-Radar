"use client";
import { useState } from "react";
import {
  companyAssumptions,
  type Assumptions,
  type Company,
} from "@buyout/engine";
import { useStored } from "../lib/storage";
import {
  KEYS,
  isScenarios,
  isAssumptions,
  scenarioAnalysis,
  type SavedScenario,
} from "../lib/workflow";
import { crore, multiple, pct } from "../lib/format";
import { PanelDialog } from "./dialog";
export function ScenarioLibrary({
  company,
  value,
  onLoad,
}: {
  company: Company;
  value: Assumptions;
  onLoad: (a: Assumptions) => void;
}) {
  const store = useStored<SavedScenario[]>(KEYS.scenarios, [], isScenarios);
  const [name, setName] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [message, setMessage] = useState("");
  const scenarios = store.value.filter((s) => s.companyId === company.id);
  const base = companyAssumptions(company);
  const cases = [
    { id: "base", name: "Base case", assumptions: base },
    ...scenarios.filter((s) => selected.includes(s.id)),
  ];
  const results = cases.map((s) => scenarioAnalysis(company, s.assumptions));
  return (
    <PanelDialog
      wide
      title="Scenario library"
      description="Save assumptions for this company. Comparisons recalculate against current published financials; saved scenarios are not historical return snapshots."
      trigger={<button className="button tonal">Scenarios</button>}
    >
      <form
        className="workflow-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !isAssumptions(value)) return;
          store.setValue((p) => [
            ...p,
            {
              id: crypto.randomUUID(),
              companyId: company.id,
              name: name.trim(),
              assumptions: { ...value },
              updatedAt: new Date().toISOString(),
            },
          ]);
          setName("");
          setMessage("Current assumptions saved.");
        }}
      >
        <label>
          Scenario name
          <input
            maxLength={80}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          className="button primary"
          disabled={!store.ready || !isAssumptions(value)}
        >
          Save current scenario
        </button>
      </form>
      {!isAssumptions(value) && (
        <p role="alert" className="error-text">
          Correct invalid assumptions in Underwriting before saving.
        </p>
      )}
      <div className="workflow-list">
        {scenarios.map((s) => (
          <ScenarioRow
            key={s.id}
            scenario={s}
            checked={selected.includes(s.id)}
            disabled={!selected.includes(s.id) && selected.length >= 3}
            onSelect={() =>
              setSelected((p) =>
                p.includes(s.id) ? p.filter((id) => id !== s.id) : [...p, s.id],
              )
            }
            onLoad={() => {
              onLoad({ ...s.assumptions });
              setMessage(`${s.name} loaded into Underwriting.`);
            }}
            onRename={(name) =>
              store.setValue((p) =>
                p.map((x) => (x.id === s.id ? { ...x, name } : x)),
              )
            }
            onDelete={() => {
              store.setValue((p) => p.filter((x) => x.id !== s.id));
              setSelected((p) => p.filter((id) => id !== s.id));
              setMessage(`${s.name} deleted.`);
            }}
          />
        ))}
      </div>
      {!scenarios.length && (
        <p className="fine-print">
          Save your first scenario to compare it with the base case.
        </p>
      )}
      <h3 className="comparison-heading">Compare assumptions and outcomes</h3>
      <p className="fine-print">
        Select up to three scenarios. Amounts in INR crore; returns are withheld
        for incomplete evidence or funding shortfalls.
      </p>
      <p className="fine-print table-hint">
        Scroll sideways to compare all columns.
      </p>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Scrollable scenario comparison"
      >
        <table className="workflow-table scenario-comparison">
          <caption className="sr-only">
            Scenario comparison using current financials
          </caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              {cases.map((s) => (
                <th key={s.id} scope="col">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Research status</th>
              {results.map((r, i) => (
                <td key={cases[i].id}>{r.status}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Sponsor equity (INR crore)</th>
              {results.map((r, i) => (
                <td key={cases[i].id}>
                  {r.model ? crore(r.model.sponsorEquity) : "Unavailable"}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Model IRR</th>
              {results.map((r, i) => (
                <td key={cases[i].id}>{pct(r.irr)}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Sponsor MOIC</th>
              {results.map((r, i) => (
                <td key={cases[i].id}>{multiple(r.moic)}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Funding gap (INR crore)</th>
              {results.map((r, i) => (
                <td key={cases[i].id}>
                  {r.model ? crore(r.model.fundingGap) : "Unavailable"}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Minimum interest coverage</th>
              {results.map((r, i) => (
                <td key={cases[i].id}>
                  {r.coverage === null
                    ? "No interest / unavailable"
                    : multiple(r.coverage)}
                </td>
              ))}
            </tr>
            {(Object.keys(base) as (keyof Assumptions)[]).map((key) => (
              <tr key={key}>
                <th scope="row">{assumptionLabel(key)}</th>
                {cases.map((s) => (
                  <td
                    key={s.id}
                    className={
                      s.assumptions[key] !== base[key]
                        ? "changed-assumption"
                        : ""
                    }
                  >
                    {assumptionValue(key, s.assumptions[key])}
                    {s.assumptions[key] !== base[key] && (
                      <span className="sr-only"> changed from base case</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fine-print">
        Changed assumptions use a heavier weight.{" "}
        {company.dataKind === "demo"
          ? "Fictional company / sample data."
          : "Published financials."}
      </p>
      <p role="status" className="action-feedback">
        {store.error || message}
      </p>
    </PanelDialog>
  );
}
const ASSUMPTION_LABELS: Record<keyof Assumptions, string> = {
  entryMultiple: "Entry EV / EBITDA",
  exitMultiple: "Exit EV / EBITDA",
  leverage: "Leverage cap",
  interestRate: "Interest rate",
  taxRate: "Tax rate",
  cashSweep: "Excess cash sweep",
  holdYears: "Hold period",
  feesRate: "Fees / entry EV",
  hurdleRate: "IRR hurdle",
  growthRate: "Revenue growth",
  marginExpansion: "Total margin change",
  capexRate: "Capex / revenue",
  depreciationRate: "D&A / revenue",
  workingCapitalRate: "Working capital / revenue",
  amortizationRate: "Mandatory repayment",
  coverageFloor: "Coverage floor",
};
export function assumptionLabel(key: keyof Assumptions) {
  return ASSUMPTION_LABELS[key];
}
export function assumptionValue(key: keyof Assumptions, value: number) {
  if (key === "holdYears") return `${value} years`;
  if (key === "marginExpansion") return `${(value * 100).toFixed(1)} pp`;
  return [
    "entryMultiple",
    "exitMultiple",
    "leverage",
    "coverageFloor",
  ].includes(key)
    ? multiple(value)
    : pct(value);
}
function ScenarioRow({
  scenario,
  checked,
  disabled,
  onSelect,
  onLoad,
  onRename,
  onDelete,
}: {
  scenario: SavedScenario;
  checked: boolean;
  disabled: boolean;
  onSelect: () => void;
  onLoad: () => void;
  onRename: (n: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false),
    [name, setName] = useState(scenario.name);
  return (
    <div className="workflow-row">
      <div>
        <label className="task-label">
          <input
            type="checkbox"
            aria-label={`Compare scenario ${scenario.name}`}
            checked={checked}
            disabled={disabled}
            onChange={onSelect}
          />
          <strong>{scenario.name}</strong>
        </label>
        <p className="fine-print">
          Saved {new Date(scenario.updatedAt).toLocaleString()}
        </p>
        {editing && (
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                onRename(name.trim());
                setEditing(false);
              }
            }}
          >
            <input
              aria-label="Rename scenario"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="text-button">Save name</button>
            <button
              type="button"
              className="text-button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
      <div className="workflow-actions">
        <button
          className="text-button"
          aria-label={`Load scenario ${scenario.name}`}
          onClick={onLoad}
        >
          Load
        </button>
        <button
          className="text-button"
          aria-label={`Rename scenario ${scenario.name}`}
          onClick={() => {
            setName(scenario.name);
            setEditing(true);
          }}
        >
          Rename
        </button>
        <button
          className="text-button"
          aria-label={`Delete scenario ${scenario.name}`}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
