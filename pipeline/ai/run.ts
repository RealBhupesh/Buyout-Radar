import { cached, cacheKey } from "./cache";
import { extract, providerConfig, PROMPT_VERSION } from "./provider";
import { findNotePages } from "./pages";
import { routeExtractions, verifyExtraction, type RoutedItem } from "./verify";
import type { Page } from "./schema";
export async function processReport(allPages: Page[]): Promise<RoutedItem[]> {
  const pages = findNotePages(allPages);
  if (!pages.length) return [];
  const a = providerConfig("A"),
    b = providerConfig("B");
  if (a.model === b.model && a.url === b.url)
    throw new Error("Two distinct models required");
  const key = cacheKey(JSON.stringify(pages), PROMPT_VERSION, [
    a.url,
    a.model,
    b.url,
    b.model,
  ]);
  return cached(key, async () => {
    const [first, second] = await Promise.all([
      extract(pages, a),
      extract(pages, b),
    ]);
    const rows = routeExtractions(first, second, pages);
    for (const row of rows.filter((r) => r.status === "review")) {
      try {
        const judged = await extract(
          pages.filter((p) =>
            [row.answer.page, ...row.alternatives.map((x) => x.page)].includes(
              p.page,
            ),
          ),
          b,
          { first: row.answer, second: row.alternatives },
        );
        const winner = judged.find(
          (j) => j.item.toLowerCase() === row.answer.item.toLowerCase(),
        );
        if (winner && verifyExtraction(winner, pages).valid) {
          row.answer = winner;
          row.status = "accepted";
          row.reason = "120B judge resolved dispute with exact evidence";
        }
      } catch {
        row.reason = "Judge unavailable; human review required";
      }
    }
    return rows;
  });
}
