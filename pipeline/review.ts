import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { parseExtractions, type Page } from "./ai/schema";
import { verifyExtraction } from "./ai/verify";
async function main() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("Server-only Supabase credentials required");
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [command, id, path] = process.argv.slice(2);
  if (command === "list") {
    const { data, error } = await db
      .from("review_queue")
      .select("id,company_id,reason,created_at")
      .is("resolved_at", null)
      .order("created_at");
    if (error) throw error;
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  if (command === "queue") {
    if (!id || !path)
      throw new Error("Usage: review queue company-id extraction-output.json");
    const rows = JSON.parse(await readFile(path, "utf8"));
    if (!Array.isArray(rows))
      throw new Error("Expected routed extraction list");
    const pending = rows.filter((r) => r.status === "review");
    for (const r of pending) parseExtractions([r.answer, ...r.alternatives]);
    if (!pending.length) {
      console.log("No unresolved items");
      return;
    }
    const { error } = await db
      .from("review_queue")
      .insert(
        pending.map((r) => ({
          company_id: id,
          answers: { answer: r.answer, alternatives: r.alternatives },
          reason: r.reason,
        })),
      );
    if (error) throw error;
    console.log(`Queued ${pending.length} unresolved items`);
    return;
  }
  if (command === "resolve") {
    if (!id || !path)
      throw new Error(
        "Usage: review resolve queue-uuid reviewed-decision.json",
      );
    const decision = JSON.parse(await readFile(path, "utf8")) as {
      reviewer: string;
      note: string;
      verdict: "accept" | "reject";
      answer: unknown;
      pages: Page[];
    };
    if (
      !decision.reviewer?.trim() ||
      !decision.note?.trim() ||
      !["accept", "reject"].includes(decision.verdict)
    )
      throw new Error(
        "Reviewer identity, rationale and accept/reject required",
      );
    const answer = parseExtractions([decision.answer])[0];
    if (
      decision.verdict === "accept" &&
      !verifyExtraction(answer, decision.pages).valid
    )
      throw new Error(
        "Accepted decision requires exact original-page evidence",
      );
    const { data: old, error: readError } = await db
      .from("review_queue")
      .select("answers")
      .eq("id", id)
      .is("resolved_at", null)
      .single();
    if (readError) throw readError;
    const { data, error } = await db
      .from("review_queue")
      .update({
        answers: { ...old.answers, decision },
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("resolved_at", null)
      .select("id");
    if (error) throw error;
    if (!data?.length) throw new Error("Item already resolved");
    console.log(
      "Decision recorded. Earnings are not changed automatically; merge reviewed one-offs into the source manifest.",
    );
    return;
  }
  throw new Error("Usage: npx tsx pipeline/review.ts list|queue|resolve ...");
}
main().catch((e) => {
  console.error((e as Error).message);
  process.exitCode = 1;
});
