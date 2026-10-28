"use client";
import { useState } from "react";
import type { Company, Assumptions } from "@buyout/engine";
import { isString, useStored } from "../lib/storage";
import { researchMemo } from "../lib/memo";
import { Glyph } from "./icons";
export function ResearchNotes({
  company,
  assumptions,
}: {
  company: Company;
  assumptions: Assumptions;
}) {
  const notes = useStored(`buyout:note:${company.id}:v1`, "", isString);
  const [feedback, setFeedback] = useState("");
  const download = () => {
    const blob = new Blob([notes.value], { type: "text/plain;charset=utf-8" }),
      url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${company.ticker}-research.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("Research note downloaded.");
  };
  return (
    <section className="work-section research-notes">
      <div className="work-section-heading">
        <h2>Keep your own conviction.</h2>
        <span>
          {notes.ready
            ? notes.error
              ? "Session only"
              : "Saved in this browser"
            : "Loading saved note"}
        </span>
      </div>
      <p className="section-explainer">
        Write the thesis, the disconfirming evidence, and what you need to learn
        next. Notes remain private to this browser.
      </p>
      <label className="sr-only" htmlFor="research-note">
        Investment research note
      </label>
      <textarea
        id="research-note"
        value={notes.value}
        maxLength={50000}
        onChange={(e) => notes.setValue(e.target.value)}
        placeholder="What makes this business worth a second look? What would make you pass?"
        rows={12}
      />
      <div className="notes-actions">
        <button
          className="text-button"
          onClick={() => {
            if (!notes.value) {
              notes.setValue(researchMemo(company, assumptions));
              setFeedback(
                "Fact-based draft added. Review every assumption before using it.",
              );
            } else
              setFeedback(
                "Your existing note is preserved. Clear it first if you want to start from a draft.",
              );
          }}
        >
          Start from model facts <Glyph name="plus" size={14} />
        </button>
        <button
          className="button tonal"
          onClick={download}
          disabled={!notes.value}
        >
          <Glyph name="download" size={15} />
          Download note
        </button>
      </div>
      <p className="fine-print" role="status">
        {notes.error ||
          feedback ||
          "Draft generation uses rules and model facts. It does not call an AI provider."}
      </p>
    </section>
  );
}
