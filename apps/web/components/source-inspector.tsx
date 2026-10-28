"use client";
import { useState } from "react";
import type { Company,FinancialYear } from "@buyout/engine";
import { PanelDialog } from "./dialog";
import { num } from "../lib/format";
import { Glyph } from "./icons";
export interface SourceSelection {year:number;field:keyof FinancialYear;}
export function SourceInspector({company,selection,onClose}:{company:Company;selection:SourceSelection|null;onClose:()=>void}) {
 const ref=selection?company.sources.find(s=>s.year===selection.year&&s.field===selection.field):undefined;
 const f=company.financials.find(f=>f.year===selection?.year);
 return <PanelDialog title="Follow the number." description="A model is only as useful as the evidence beneath it." open={selection!==null} onOpenChange={open=>{if(!open)onClose();}}>{selection&&<div className="source-details"><div><span>{selection.field} · FY{selection.year}</span><strong>{f?`${selection.field==="shares"?"":"₹"}${num(f[selection.field],2)}${selection.field==="shares"?" shares":" Cr"}`:"Unavailable"}</strong></div>{ref?<><dl><div><dt>Document</dt><dd>{ref.title}</dd></div><div><dt>Filing ID</dt><dd>{ref.filingId}</dd></div><div><dt>Page</dt><dd>{ref.page}</dd></div><div><dt>Evidence type</dt><dd>{ref.kind==="demo"?"Synthetic reference ledger":"Published filing"}</dd></div></dl>{ref.kind==="demo"?<p className="source-warning">This figure is generated for a fictional company. The page reference demonstrates provenance handling and does not cite a real annual report.</p>:<a className="button tonal" href={`${ref.url}#page=${ref.page}`} target="_blank" rel="noreferrer">Open original filing<Glyph name="arrow" size={16}/></a>}</>:<p className="error-text">This field is missing a source. It must not be used for an investment decision.</p>}</div>}</PanelDialog>;
}
export function EvidenceRegister({company,onSelect}:{company:Company;onSelect:(s:SourceSelection)=>void}) {
 const [year,setYear]=useState(company.financials.at(-1)!.year);
 const sources=company.sources.filter(s=>s.year===year);
 return <section className="work-section"><div className="work-section-heading"><h2>The evidence register.</h2><label className="year-select">Year<select aria-label="Evidence year" value={year} onChange={e=>setYear(Number(e.target.value))}>{company.financials.map(f=><option key={f.year}>{f.year}</option>)}</select></label></div><p className="section-explainer">Every stored financial field carries its own document and page reference.</p><div className="evidence-list">{sources.map(s=><button key={s.field} onClick={()=>onSelect({year,field:s.field})}><span>{s.field}</span><span>{s.kind==="demo"?"Sample ledger":"Filing"} · p. {s.page}</span><Glyph name="arrow" size={14}/></button>)}</div></section>;
}
