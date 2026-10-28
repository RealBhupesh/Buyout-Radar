export const num = (v: number, digits = 0) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v);
export const crore = (v: number) => `₹${num(v)} Cr`;
export const pct = (v: number | null, digits = 1) =>
  v === null || !Number.isFinite(v)
    ? "Unavailable"
    : `${(v * 100).toFixed(digits)}%`;
export const multiple = (v: number | null, digits = 1) =>
  v === null || !Number.isFinite(v) ? "Unavailable" : `${v.toFixed(digits)}×`;
export function safeText(value: string): string {
  return value.replace(/[\u0000-\u001f]/g, "").slice(0, 50000);
}
