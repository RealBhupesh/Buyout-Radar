"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { Research } from "../lib/research";
import { pct } from "../lib/format";
import { Glyph } from "./icons";
export function OpportunityMap({
  rows,
  hurdle,
}: {
  rows: Research[];
  hurdle: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();
  const eligible = rows.filter(
    (r) => r.irr !== null && r.cash.averageConversion !== null,
  );
  const focus = eligible.find((r) => r.company.id === hovered) ?? eligible[0];
  const xs = eligible.map((r) => r.cash.averageConversion!);
  const ys = eligible.map((r) => r.irr!);
  const lowX =
    expanded && xs.length ? Math.min(...xs) - 0.05 : Math.min(0, ...xs);
  const highX =
    expanded && xs.length ? Math.max(...xs) + 0.05 : Math.max(1, ...xs);
  const lowY =
    expanded && ys.length ? Math.min(hurdle, ...ys) - 0.03 : Math.min(0, ...ys);
  const highY =
    expanded && ys.length
      ? Math.max(hurdle, ...ys) + 0.03
      : Math.max(0.35, hurdle + 0.05, ...ys);
  const x = (v: number) => 70 + ((v - lowX) / (highX - lowX)) * 620;
  const y = (v: number) => 164 - ((v - lowY) / (highY - lowY)) * 118;
  const ticks = (low: number, high: number) =>
    Array.from({ length: 5 }, (_, i) => low + ((high - low) * i) / 4);
  return (
    <section className="map-section" aria-labelledby="map-title">
      <div className="map-copy">
        <div>
          <h2 id="map-title">Opportunity map</h2>
          <p>Historical cash conversion vs modeled sponsor IRR.</p>
        </div>
        <div className="map-legend">
          <span className="legend-dot" />
          Each point is a company
          <span className="legend-target" />
          Above your hurdle
        </div>
        <div className="map-focus" aria-live="polite">
          {focus ? (
            <>
              <span>{focus.company.sector}</span>
              <Link href={`/company/${focus.company.id}`}>
                {focus.company.name}
                <Glyph name="arrow" size={18} />
              </Link>
              <div>
                <strong>{pct(focus.irr)}</strong>
                <span>5-year model IRR</span>
              </div>
              <small>
                {pct(focus.cash.averageConversion, 0)} cash conversion ·{" "}
                {focus.assumptions.entryMultiple.toFixed(1)}× entry
              </small>
            </>
          ) : (
            <p>No complete models match this view.</p>
          )}
        </div>
      </div>
      <div className="map-chart">
        <div className="map-controls">
          <label>
            Focus a company
            <select
              aria-label="Focus a company on map"
              value={focus?.company.id ?? ""}
              disabled={!eligible.length}
              onChange={(e) => setHovered(e.target.value)}
            >
              {!eligible.length && <option value="">No complete models</option>}
              {eligible.map((r) => (
                <option key={r.company.id} value={r.company.id}>
                  {r.company.name}
                </option>
              ))}
            </select>
          </label>
          <button
            aria-pressed={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            Expand clustered points
          </button>
        </div>
        <p className="map-scale-note">
          {expanded ? "Expanded axes" : "Full-range axes"} · Shaded region meets
          your IRR hurdle.
        </p>
        <div
          className="map-plot"
          role="region"
          tabIndex={0}
          aria-label="Scrollable opportunity plot"
        >
          <svg
            viewBox="0 0 760 222"
            role="group"
            aria-label="Opportunity map: cash conversion on the horizontal axis, model IRR on the vertical axis"
          >
            <rect
              x="70"
              y="40"
              width="620"
              height={Math.max(0, Math.min(124, y(hurdle) - 40))}
              fill="var(--plot-band)"
              rx="3"
            />
            <text
              x="681"
              y="57"
              textAnchor="end"
              fill="var(--muted)"
              fontSize="12"
            >
              Your hurdle: {pct(hurdle, 0)}
            </text>
            {ticks(lowY, highY).map((t) => (
              <g key={t}>
                <path
                  d={`M70 ${y(t)}H690`}
                  stroke="var(--plot-grid)"
                  strokeDasharray="2 6"
                  strokeLinecap="round"
                />
                <text
                  x="53"
                  y={y(t) + 4}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize="13"
                >
                  {pct(t, expanded ? 1 : 0)}
                </text>
              </g>
            ))}
            {ticks(lowX, highX).map((t) => (
              <text
                key={t}
                x={x(t)}
                y="188"
                textAnchor="middle"
                fill="var(--muted)"
                fontSize="13"
              >
                {pct(t, expanded ? 1 : 0)}
              </text>
            ))}
            <text
              x="380"
              y="217"
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="13"
            >
              Historical cash conversion
            </text>
            <text
              transform="translate(16 107) rotate(-90)"
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="13"
            >
              Model IRR
            </text>
            {eligible.map((r) => (
              <a
                key={r.company.id}
                href={`/company/${r.company.id}`}
                aria-label={`${r.company.name}, IRR ${pct(r.irr)}`}
                onFocus={() => setHovered(r.company.id)}
                onMouseEnter={() => setHovered(r.company.id)}
              >
                <motion.circle
                  initial={false}
                  animate={{
                    cx: x(r.cash.averageConversion ?? 0),
                    cy: y(r.irr!),
                    r: focus?.company.id === r.company.id ? 8 : 5,
                  }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 130, damping: 24 }
                  }
                  fill={
                    r.irr! >= hurdle ? "var(--data-hue)" : "var(--plot-neutral)"
                  }
                  stroke={
                    focus?.company.id === r.company.id
                      ? "var(--ink)"
                      : "var(--surface)"
                  }
                  strokeWidth={focus?.company.id === r.company.id ? 2 : 1}
                  opacity={
                    hovered &&
                    eligible.some((point) => point.company.id === hovered) &&
                    hovered !== r.company.id
                      ? 0.4
                      : 0.95
                  }
                />
                <title>{`${r.company.name}: ${pct(r.irr)} IRR, ${pct(r.cash.averageConversion)} cash conversion`}</title>
              </a>
            ))}
          </svg>
        </div>
        <p className="chart-scroll-hint">
          Scroll the plot sideways or use the company selector for overlapping
          points.
        </p>
      </div>
    </section>
  );
}
