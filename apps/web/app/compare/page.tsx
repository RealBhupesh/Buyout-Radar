import Link from "next/link";
import { getCompanies } from "../../lib/repository";
import { comparisonIds } from "../../lib/workflow";
import { CompanyComparison } from "../../components/company-comparison";
export const metadata = { title: "Company comparison" };
export const dynamic = "force-dynamic";
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const { ids, notices } = comparisonIds((await searchParams).ids);
  const universe = await getCompanies();
  const companies = ids.flatMap((id) => {
    const c = universe.find((c) => c.id === id);
    return c ? [c] : [];
  });
  if (companies.length !== ids.length)
    notices.push(
      "Some selected companies are unavailable or no longer published.",
    );
  return (
    <div className="page comparison-page">
      <header className="page-heading">
        <div>
          <h1>Company comparison</h1>
          <p>
            Same measures. Different businesses. Base assumptions using current
            financials.
          </p>
        </div>
        <Link className="button tonal" href="/">
          Back to Radar
        </Link>
      </header>
      {notices.map((n) => (
        <p key={n} role="status" className="data-notice">
          {n}
        </p>
      ))}
      {companies.length < 2 ? (
        <section className="work-section">
          <h2>Select at least two companies.</h2>
          <p>
            Return to Radar or Saved Research and select two to four companies
            to compare.
          </p>
        </section>
      ) : (
        <CompanyComparison companies={companies} />
      )}
    </div>
  );
}
