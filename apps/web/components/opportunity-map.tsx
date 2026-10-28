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
  const y = (v: number) => 224 - ((v - lowY) / (highY - lowY)) * 178;
  const ticks = (low: number, high: number) =>
    Array.from({ length: 5 }, (_, i) => low + ((high - low) * i) / 4);
  return (
    <section className="map-section" aria-labelledby="map-title">
      <div className="map-copy">
        <div>
          <h2 id="map-title">Good cash. Sensible price.</h2>
          <p>The buyout lens turns quality into a question of returns.</p>
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
          {expanded
            ? "Expanded axes: ranges follow these results and your hurdle."
            : "Full-range axes: all points keep their true values."}{" "}
          Select a company to inspect overlapping points.
        </p>
        <div
          className="map-plot"
          role="region"
          tabIndex={0}
          aria-label="Scrollable opportunity plot"
        >
          <svg
            viewBox="0 0 760 282"
            role="group"
            aria-label="Opportunity map: cash conversion on the horizontal axis, model IRR on the vertical axis"
          >
            <rect
              x="70"
              y="40"
              width="620"
              height={Math.max(0, Math.min(184, y(hurdle) - 40))}
              fill="#35594b"
              rx="3"
            />
            <text x="681" y="57" textAnchor="end" fill="#c9ddcc" fontSize="12">
              Your hurdle: {pct(hurdle, 0)}
            </text>
            {ticks(lowY, highY).map((t) => (
              <g key={t}>
                <path
                  d={`M70 ${y(t)}H690`}
                  stroke="#597467"
                  strokeDasharray="2 6"
                  strokeLinecap="round"
                />
                <text
                  x="53"
                  y={y(t) + 4}
                  textAnchor="end"
                  fill="#c5d5cc"
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
                y="248"
                textAnchor="middle"
                fill="#c5d5cc"
                fontSize="13"
              >
                {pct(t, expanded ? 1 : 0)}
              </text>
            ))}
            <text
              x="380"
              y="275"
              textAnchor="middle"
              fill="#e1e9e3"
              fontSize="13"
            >
              Historical cash conversion
            </text>
            <text
              transform="translate(16 137) rotate(-90)"
              textAnchor="middle"
              fill="#e1e9e3"
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
                  fill={r.irr! >= hurdle ? "#d1e1b7" : "#8aa99a"}
                  stroke={
                    focus?.company.id === r.company.id ? "#fff" : "#234638"
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
