/** Conventional periodic IRR. Multiple sign-change cash flows are deliberately unsupported. */
export function irr(flows: number[]): number | null {
  if (
    flows.length < 2 ||
    flows.some((v) => !Number.isFinite(v)) ||
    flows[0] >= 0 ||
    flows.slice(1).some((v) => v < 0)
  )
    return null;
  if (flows.slice(1).every((v) => v === 0)) return -1;
  const npv = (r: number) =>
    flows.reduce((sum, v, i) => sum + v / Math.pow(1 + r, i), 0);
  let low = -0.999999999,
    high = 1;
  while (npv(high) > 0 && high < 1e12) high *= 2;
  if (npv(high) > 0) return null;
  for (let i = 0; i < 180; i++) {
    const mid = (low + high) / 2;
    if (npv(mid) > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
