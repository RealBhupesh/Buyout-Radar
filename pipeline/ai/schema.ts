export interface Page {
  page: number;
  text: string;
}
export interface Extraction {
  item: string;
  amount: number;
  unit: "crore" | "lakh" | "INR";
  quote: string;
  page: number;
  category: "one-off" | "related-party" | "contingent";
  direction: "add" | "subtract" | "disclose";
}
export function parseExtractions(input: unknown): Extraction[] {
  if (!Array.isArray(input) || input.length > 25)
    throw new Error("Expected at most 25 extraction items");
  const identities = new Set<string>();
  return input.map((x) => {
    if (!x || typeof x !== "object") throw new Error("Invalid extraction");
    const v = x as Record<string, unknown>;
    if (
      Object.keys(v).some(
        (k) =>
          ![
            "item",
            "amount",
            "unit",
            "quote",
            "page",
            "category",
            "direction",
          ].includes(k),
      )
    )
      throw new Error("Unknown extraction field");
    const identity = `${String(v.item).trim().toLowerCase()}:${v.page}:${v.category}`;
    if (identities.has(identity))
      throw new Error("Duplicate extraction identity");
    identities.add(identity);
    if (
      typeof v.item !== "string" ||
      !v.item.trim() ||
      v.item.length > 200 ||
      typeof v.quote !== "string" ||
      v.quote.length < 12 ||
      v.quote.length > 4000 ||
      typeof v.amount !== "number" ||
      !Number.isFinite(v.amount) ||
      v.amount < 0 ||
      !Number.isInteger(v.page) ||
      Number(v.page) < 1 ||
      !["crore", "lakh", "INR"].includes(String(v.unit)) ||
      !["one-off", "related-party", "contingent"].includes(
        String(v.category),
      ) ||
      !["add", "subtract", "disclose"].includes(String(v.direction))
    )
      throw new Error("Extraction violates schema");
    if (v.category !== "one-off" && v.direction !== "disclose")
      throw new Error("Non-earnings items must be disclosure-only");
    return v as unknown as Extraction;
  });
}
export const toCrore = (x: Extraction) =>
  x.amount * (x.unit === "crore" ? 1 : x.unit === "lakh" ? 0.01 : 1e-7);
