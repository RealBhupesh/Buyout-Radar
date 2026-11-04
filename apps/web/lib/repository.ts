import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Company, Adjustment, SourceRef } from "@buyout/engine";
import { DEMO_COMPANIES } from "./demo";
import { provenanceIssues } from "./provenance";
const companyProjection =
  "*,financials:financials!financials_company_id_fkey(*),adjustments:adjustments!adjustments_company_id_fkey(*),source_refs:source_refs!source_refs_company(*)";

export const dataMode = () =>
  process.env.DATA_MODE === "supabase" ? "supabase" : "demo";

function researchDatabase() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error("Database mode selected but credentials are missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function checkResearchDatabase() {
  if (dataMode() === "demo") return;
  const { error } = await researchDatabase()
    .from("companies")
    .select(companyProjection, { head: true })
    .eq("is_published", true)
    .limit(1)
    .retry(false)
    .abortSignal(AbortSignal.timeout(3000));
  if (error) throw new Error("Research database health check failed");
}

async function loadCompanies(id?: string): Promise<Company[]> {
  if (dataMode() === "demo")
    return id ? DEMO_COMPANIES.filter((c) => c.id === id) : DEMO_COMPANIES;
  let query = researchDatabase()
    .from("companies")
    .select(companyProjection)
    .eq("is_published", true)
    .order("name")
    .order("id");
  if (id) query = query.eq("id", id);
  const { data, error } = await query
    .limit(id ? 1 : 1000)
    .abortSignal(AbortSignal.timeout(8000));
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
