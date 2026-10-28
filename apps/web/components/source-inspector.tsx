"use client";
import { useState } from "react";
import type { Company, SourceRef } from "@buyout/engine";
import { PanelDialog } from "./dialog";
import { sourceValue } from "../lib/provenance";
import { num } from "../lib/format";
import { Glyph } from "./icons";
import { FIELD_LABELS, EVIDENCE_GROUPS } from "../lib/analyst";
export interface SourceSelection {
  year: number;
  field: SourceRef["field"];
}
export function SourceInspector({
  company,
  selection,
  onClose,
}: {
  company: Company;
  selection: SourceSelection | null;
  onClose: () => void;
}) {
  const ref = selection
    ? company.sources.find(
        (s) => s.year === selection.year && s.field === selection.field,
      )
    : undefined;
  const value = selection
    ? sourceValue(company, selection.field, selection.year)
    : undefined;
  const isPercent =
    selection?.field === "promoterPct" || selection?.field === "pledgedPct";
  return (
    <PanelDialog
      title="Follow the number."
      description="A model is only as useful as the evidence beneath it."
      open={selection !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {selection && (
        <div className="source-details">
          <div>
            <span>
              {FIELD_LABELS[selection.field]} · FY{selection.year}
            </span>
            <strong>
              {value !== undefined
                ? `${selection.field === "shares" || isPercent ? "" : "₹"}${num(value, 2)}${isPercent ? "%" : selection.field === "shares" ? " shares" : " Cr"}`
                : "Unavailable"}
            </strong>
          </div>
          {ref ? (
            <>
              <dl>
                <div>
                  <dt>Document</dt>
                  <dd>{ref.title}</dd>
                </div>
                <div>
                  <dt>Filing ID</dt>
                  <dd>{ref.filingId}</dd>
                </div>
                <div>
                  <dt>Page</dt>
                  <dd>{ref.page}</dd>
                </div>
                <div>
                  <dt>Evidence type</dt>
                  <dd>
                    {ref.kind === "demo"
                      ? "Synthetic reference ledger"
                      : "Published filing"}
                  </dd>
                </div>
              </dl>
              {ref.kind === "demo" ? (
                <p className="source-warning">
                  This figure is generated for a fictional company. The page
                  reference demonstrates provenance handling and does not cite a
                  real annual report.
                </p>
              ) : (
                <a
                  className="button tonal"
                  href={`${ref.url}#page=${ref.page}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original filing
                  <Glyph name="arrow" size={16} />
                </a>
              )}
            </>
          ) : (
            <p className="error-text">
              This field is missing a source. It must not be used for an
              investment decision.
            </p>
          )}
        </div>
      )}
    </PanelDialog>
  );
}
export function EvidenceRegister({
  company,
  onSelect,
}: {
  company: Company;
  onSelect: (s: SourceSelection) => void;
}) {
  const [year, setYear] = useState(company.financials.at(-1)!.year);
  const sources = company.sources.filter((s) => s.year === year);
  return (
    <section className="work-section">
      <div className="work-section-heading">
        <h2>The evidence register.</h2>
        <label className="year-select">
          Year
          <select
            aria-label="Evidence year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {company.financials.map((f) => (
              <option key={f.year}>{f.year}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="section-explainer">
        Every stored financial field carries its own document and page
        reference.
      </p>
      {EVIDENCE_GROUPS.map((group) => {
        const refs = sources.filter((s) =>
          group.fields.some((f) => f === s.field),
        );
        return (
          refs.length > 0 && (
            <div className="evidence-group" key={group.name}>
              <h3>{group.name}</h3>
              <div className="evidence-list">
                {refs.map((s) => (
                  <button
                    key={s.field}
                    onClick={() => onSelect({ year, field: s.field })}
                  >
                    <span>{FIELD_LABELS[s.field]}</span>
                    <span>
                      {s.kind === "demo" ? "Sample ledger" : "Filing"} · p.{" "}
                      {s.page}
                    </span>
                    <Glyph name="arrow" size={14} />
                  </button>
                ))}
              </div>
            </div>
          )
        );
      })}
    </section>
  );
}
