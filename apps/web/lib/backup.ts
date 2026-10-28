import {
  KEYS,
  isBuyBox,
  isScreens,
  isScenarios,
  isWorkflows,
} from "./workflow";
export interface ResearchBackup {
  format: "buyout-radar";
  version: 1;
  exportedAt: string;
  values: Record<string, unknown>;
}
export function validStorageEntry(key: string, value: unknown): boolean {
  switch (key) {
    case KEYS.saved:
      return (
        Array.isArray(value) &&
        value.length <= 1000 &&
        value.every(
          (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{1,99}$/.test(v),
        )
      );
    case KEYS.box:
      return isBuyBox(value);
    case KEYS.screens:
      return isScreens(value);
    case KEYS.scenarios:
      return isScenarios(value);
    case KEYS.workflows:
      return isWorkflows(value);
    default:
      return (
        /^buyout:note:[a-zA-Z0-9_-]{1,100}:v1$/.test(key) &&
        typeof value === "string" &&
        value.length <= 50000
      );
  }
}
export function createBackup(values: Record<string, unknown>): ResearchBackup {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!validStorageEntry(key, value))
      throw new Error(`Cannot back up invalid or unsupported research: ${key}`);
    filtered[key] = value;
  }
  const backup: ResearchBackup = {
    format: "buyout-radar",
    version: 1,
    exportedAt: new Date().toISOString(),
    values: filtered,
  };
  if (new TextEncoder().encode(JSON.stringify(backup)).length > 5 * 1024 * 1024)
    throw new Error(
      "Research exceeds the 5 MB backup limit. Nothing was exported.",
    );
  return backup;
}
export function parseBackup(raw: string): ResearchBackup {
  if (new TextEncoder().encode(raw).length > 5 * 1024 * 1024)
    throw new Error("Backup exceeds the 5 MB import limit.");
  let b: ResearchBackup;
  try {
    b = JSON.parse(raw);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (
    !b ||
    b.format !== "buyout-radar" ||
    b.version !== 1 ||
    typeof b.exportedAt !== "string" ||
    !Number.isFinite(Date.parse(b.exportedAt)) ||
    !b.values ||
    typeof b.values !== "object" ||
    Array.isArray(b.values) ||
    !Object.keys(b.values).length
  )
    throw new Error("Unsupported or empty Buyout Radar backup.");
  for (const [key, value] of Object.entries(b.values))
    if (!validStorageEntry(key, value))
      throw new Error(`Invalid backup record: ${key}. Nothing was restored.`);
  return b;
}
function identity(key: string, x: unknown): string {
  const v = x as Record<string, string>;
  return key === KEYS.workflows ? v.companyId : v.id;
}
export function mergeBackup(
  local: Record<string, unknown>,
  incoming: ResearchBackup,
  replace = false,
) {
  const values: Record<string, unknown> = {};
  const conflicts: string[] = [];
  let added = 0;
  for (const [key, next] of Object.entries(incoming.values)) {
    const previous = local[key];
    if (previous === undefined) {
      values[key] = next;
      added += Array.isArray(next) ? next.length : 1;
      continue;
    }
    if (!validStorageEntry(key, previous))
      throw new Error(
        `Existing research is invalid: ${key}. Restore cannot merge it safely.`,
      );
    if (key === KEYS.saved) {
      values[key] = [
        ...new Set([...(previous as string[]), ...(next as string[])]),
      ];
      added += (values[key] as string[]).length - (previous as string[]).length;
    } else if (
      [KEYS.screens, KEYS.scenarios, KEYS.workflows].includes(
        key as typeof KEYS.screens,
      )
    ) {
      const merged = [...(previous as unknown[])];
      for (const record of next as unknown[]) {
        const index = merged.findIndex(
          (p) => identity(key, p) === identity(key, record),
        );
        if (index < 0) {
          merged.push(record);
          added++;
        } else if (JSON.stringify(merged[index]) !== JSON.stringify(record)) {
          const r = record as Record<string, string>;
          conflicts.push(`${key.split(":")[1]}: ${r.name ?? r.companyId}`);
          if (replace) merged[index] = record;
        }
      }
      values[key] = merged;
    } else {
      const differs = JSON.stringify(previous) !== JSON.stringify(next);
      if (differs)
        conflicts.push(
          key === KEYS.box ? "Active Buy Box" : `Note: ${key.split(":")[2]}`,
        );
      values[key] = differs && !replace ? previous : next;
    }
    if (!validStorageEntry(key, values[key]))
      throw new Error(
        `Merged ${key.split(":")[1]} exceeds the supported limits. Nothing was restored.`,
      );
  }
  return { values, conflicts, added };
}
