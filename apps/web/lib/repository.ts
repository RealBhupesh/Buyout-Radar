import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Company, Adjustment, SourceRef } from "@buyout/engine";
import { DEMO_COMPANIES } from "./demo";
import { provenanceIssues } from "./provenance";
async function loadCompanies(id?: string): Promise<Company[]> {
  if (process.env.DATA_MODE !== "supabase")
    return id ? DEMO_COMPANIES.filter((c) => c.id === id) : DEMO_COMPANIES;
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error("Database mode selected but credentials are missing");
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let query = db
    .from("companies")
    .select(
      "*,financials:financials!financials_company_id_fkey(*),adjustments:adjustments!adjustments_company_id_fkey(*),source_refs:source_refs!source_refs_company(*)",
    )
    .eq("is_published", true)
    .order("name");
  if (id) query = query.eq("id", id);
  const { data, error } = await query.limit(id ? 1 : 1000);
  if (error)
    throw new Error(
      "The research database is unavailable. Please retry shortly.",
    );
  return (data ?? []).map((row) => {
    const c: Company = {
      id: row.id,
      name: row.name,
      ticker: row.ticker,
      sector: row.sector,
      description: row.description,
      marketCap: Number(row.market_cap),
      promoterPct: Number(row.promoter_pct),
      pledgedPct: Number(row.pledged_pct),
      entryMultiple: Number(row.entry_multiple),
      growthRate: Number(row.growth_rate),
      dataKind: row.data_kind,
      qualityIssues: row.quality_issues ?? [],
      financials: (row.financials ?? [])
        .map((f: { data: Company["financials"][number] }) => f.data)
        .sort(
          (
            a: Company["financials"][number],
            b: Company["financials"][number],
          ) => a.year - b.year,
        ),
      adjustments: (row.adjustments ?? []).map(
        (a: Record<string, unknown>): Adjustment => ({
          id: String(a.id),
          year: Number(a.period),
          label: String(a.label),
          amount: Number(a.amount),
          quote: String(a.quote),
          page: Number(a.page),
          filingId: String(a.filing_id),
          status: a.status as Adjustment["status"],
        }),
      ),
      sources: (row.source_refs ?? []).map(
        (s: Record<string, unknown>): SourceRef => ({
          field: s.field as SourceRef["field"],
          year: Number(s.period),
          filingId: String(s.filing_id),
          page: Number(s.page),
          url: String(s.url),
          title: String(s.title),
          kind: s.kind as SourceRef["kind"],
        }),
      ),
    };
    c.qualityIssues = [...c.qualityIssues, ...provenanceIssues(c)];
    return c;
  });
}
export const getCompanies = cache(async () => loadCompanies());
export const getCompany = cache(
  async (id: string) => (await loadCompanies(id))[0],
);
