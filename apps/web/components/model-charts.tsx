"use client";
import type { LboResult } from "@buyout/engine";
import { crore, num } from "../lib/format";
export function DebtChart({ model }: { model: LboResult }) {
  const ps = model.projections,
    max = Math.max(
      model.initialDebt,
      ...ps.flatMap((p) => [p.ebitda, p.closingDebt]),
      1,
    );
  const x = (i: number) => 58 + (i / ps.length) * 590,
    y = (v: number) => 174 - (v / max) * 132;
  const debt = [
    [x(0), y(model.initialDebt)],
    ...ps.map((p, i) => [x(i + 1), y(p.closingDebt)]),
  ]
    .map((p) => p.join(","))
    .join(" ");
  const ebitda = [
    [x(0), y(model.entryEbitda)],
    ...ps.map((p, i) => [x(i + 1), y(p.ebitda)]),
  ]
    .map((p) => p.join(","))
    .join(" ");
  return (
    <figure className="debt-chart">
      <figcaption>
        <h3>Debt & EBITDA</h3>
        <div>
          <span className="chart-key debt-key" />
          Debt
          <span className="chart-key earnings-key" />
          EBITDA
        </div>
      </figcaption>
      <div
        className="debt-plot"
        role="region"
        tabIndex={0}
        aria-label="Scrollable debt and EBITDA chart"
      >
        <svg
          viewBox="0 0 700 212"
          role="img"
          aria-label={`Debt falls from ${crore(model.initialDebt)} to ${crore(ps.at(-1)!.closingDebt)} over ${ps.length} years.`}
        >
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <text
                x="45"
                y={y(max * t) + 4}
                textAnchor="end"
                fontSize="13"
                fill="var(--muted)"
              >
                {num(max * t)}
              </text>
              <path
                d={`M58 ${y(max * t)}H648`}
                stroke="var(--plot-grid)"
                strokeLinecap="round"
                strokeDasharray="2 6"
              />
            </g>
          ))}
          <polyline
            points={debt}
            fill="none"
            stroke="var(--data-hue)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={ebitda}
            fill="none"
            stroke="var(--plot-neutral)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {["Entry", ...ps.map((p) => String(p.year))].map((v, i) => (
            <text
              x={x(i)}
              y="201"
              key={v}
              textAnchor="middle"
              fontSize="13"
              fill="var(--muted)"
            >
              {v}
            </text>
          ))}
          {ps.map((p, i) => (
            <circle
              key={p.year}
              cx={x(i + 1)}
              cy={y(p.closingDebt)}
              r="3.5"
              fill="var(--data-hue)"
            />
          ))}
        </svg>
      </div>
      <p>₹ Cr · Mandatory repayment precedes the excess cash sweep.</p>
    </figure>
  );
}
export function ValueBridge({ model }: { model: LboResult }) {
  const rows = [
    { label: "EBITDA growth", value: model.bridge.growth },
    { label: "Exit multiple change", value: model.bridge.multiple },
    { label: "Net debt reduction", value: model.bridge.deleveraging },
    { label: "Transaction fees", value: model.bridge.fees },
    ...(model.bridge.equityFloor > 0
      ? [{ label: "Limited liability floor", value: model.bridge.equityFloor }]
      : []),
  ];
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <section className="work-section">
      <div className="work-section-heading">
        <h2>Equity value bridge</h2>
        <span>Equity gain, ₹ Cr</span>
      </div>
      <div className="bridge-rows">
        {rows.map((r) => (
          <div className="bridge-row" key={r.label}>
            <span>{r.label}</span>
            <div className="bridge-track">
              <i
                className={r.value < 0 ? "negative" : ""}
                style={{ width: `${(Math.abs(r.value) / max) * 100}%` }}
              />
            </div>
            <strong>
              {r.value >= 0 ? "+" : ""}
              {num(r.value)}
            </strong>
          </div>
        ))}
        <div className="bridge-total">
          <span>Total equity gain</span>
          <strong>{crore(model.bridge.total)}</strong>
        </div>
      </div>
      <p className="fine-print">
        Growth is valued at the entry multiple. Multiple change is applied to
        exit EBITDA. Fees are shown separately so the bridge reconciles exactly.
      </p>
    </section>
  );
}
