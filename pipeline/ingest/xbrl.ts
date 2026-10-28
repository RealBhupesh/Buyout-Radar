import { XMLParser } from "fast-xml-parser";
import type { FinancialYear } from "../../packages/engine/src/types";
interface Selection {
  year: number;
  contextId: string;
  fields: Partial<Record<keyof FinancialYear, string>>;
}
const asArray = (x: unknown): Record<string, unknown>[] =>
  x == null ? [] : ((Array.isArray(x) ? x : [x]) as Record<string, unknown>[]);
/** Fail closed: each field must have one fact in the explicitly selected undimensioned context. */
export function parseXbrl(
  xml: string,
  selection: Selection,
): Partial<FinancialYear> {
  if (xml.length > 20_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("Unsafe or oversized XML");
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
  });
  const root = parser.parse(xml).xbrl;
  if (!root) throw new Error("XBRL instance required");
  const context = asArray(root.context).find(
    (c) => c["@_id"] === selection.contextId,
  );
  if (!context) throw new Error("Selected XBRL context missing");
  const entity = context.entity as Record<string, unknown>;
  if (entity?.segment || context.scenario)
    throw new Error("Dimensional contexts are not consolidated totals");
  const period = context.period as Record<string, string>;
  const end = period.endDate || period.instant;
  if (end !== `${selection.year}-03-31`)
    throw new Error("Context does not match financial year end");
  if (period.startDate && period.startDate !== `${selection.year - 1}-04-01`)
    throw new Error("Annual duration required");
  const result: Partial<FinancialYear> = { year: selection.year };
  for (const [field, tag] of Object.entries(selection.fields)) {
    const facts = asArray(root[tag]).filter(
      (f) => f["@_contextRef"] === selection.contextId,
    );
    if (facts.length !== 1)
      throw new Error(`Expected one ${field} fact in selected context`);
    const fact = facts[0];
    if (fact["@_nil"] === "true") throw new Error(`Nil ${field}`);
    const unit = asArray(root.unit).find(
      (u) => u["@_id"] === fact["@_unitRef"],
    );
    const measure = String(unit?.measure ?? "");
    if (field !== "shares" && !/(^|:)INR$/.test(measure))
      throw new Error(`Unsupported ${field} unit`);
    if (field === "shares" && !/(^|:)shares$/i.test(measure))
      throw new Error("Shares unit required");
    const value = Number(String(fact["#text"]).replaceAll(",", ""));
    if (!Number.isFinite(value)) throw new Error(`Invalid ${field} number`);
    (result as Record<string, number>)[field] =
      field === "shares" ? value : value / 1e7;
  }
  return result;
}
