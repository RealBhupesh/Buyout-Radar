"use client";
import { useState } from "react";
import {
  createBackup,
  mergeBackup,
  parseBackup,
  type ResearchBackup,
} from "../lib/backup";
import { storageValues, restoreValues } from "../lib/storage";
import { downloadText } from "../lib/research-export";
import { PanelDialog } from "./dialog";
export function ResearchBackupTools() {
  const [pending, setPending] = useState<ResearchBackup | null>(null),
    [snapshot, setSnapshot] = useState<Record<string, unknown>>({}),
    [replace, setReplace] = useState(false),
    [message, setMessage] = useState("");
  let preview: ReturnType<typeof mergeBackup> | null = null;
  let previewError = "";
  try {
    if (pending) preview = mergeBackup(snapshot, pending, replace);
  } catch (e) {
    previewError = (e as Error).message;
  }
  return (
    <PanelDialog
      title="Research backup"
      description="Backups include your private notes and all saved research. Store the file somewhere you trust."
      trigger={<button className="button tonal">Backup & restore</button>}
    >
      <div className="backup-actions">
        <button
          className="button primary"
          onClick={() => {
            try {
              const backup = createBackup(storageValues());
              downloadText(
                `buyout-radar-${backup.exportedAt.slice(0, 10)}.json`,
                JSON.stringify(backup),
                "application/json",
              );
              setMessage(
                "Research backup downloaded, including private notes.",
              );
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        >
          Download backup
        </button>
        <label className="file-field">
          Choose a backup to preview
          <input
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              setPending(null);
              setReplace(false);
              setMessage("");
              if (!file) return;
              try {
                if (file.size > 5 * 1024 * 1024)
                  throw new Error("Backup exceeds the 5 MB import limit.");
                const backup = parseBackup(await file.text());
                const current = storageValues();
                mergeBackup(current, backup);
                setSnapshot(current);
                setPending(backup);
              } catch (error) {
                setMessage((error as Error).message);
              }
            }}
          />
        </label>
      </div>
      {pending && preview && (
        <section className="restore-preview" aria-label="Restore preview">
          <h3>Review the import</h3>
          <p>
            Exported {new Date(pending.exportedAt).toLocaleString()}.{" "}
            {preview.added} new records; {preview.conflicts.length} conflicts.
          </p>
          <p className="fine-print">
            Saved company lists are combined. Other records merge by identity.
            Private notes are included.
          </p>
          {preview.conflicts.length > 0 && (
            <>
              <ul>
                {preview.conflicts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
              <label className="workflow-label">
                Conflicting records
                <select
                  aria-label="Conflicting records"
                  value={replace ? "replace" : "keep"}
                  onChange={(e) => setReplace(e.target.value === "replace")}
                >
                  <option value="keep">Keep my existing records</option>
                  <option value="replace">
                    Replace conflicts with imported records
                  </option>
                </select>
              </label>
            </>
          )}
          <div className="workflow-actions">
            <button
              className="button primary"
              onClick={() => {
                try {
                  const current = storageValues();
                  if (JSON.stringify(current) !== JSON.stringify(snapshot)) {
                    setSnapshot(current);
                    setReplace(false);
                    setMessage(
                      "Local research changed. Review the refreshed preview before restoring.",
                    );
                    return;
                  }
                  restoreValues(mergeBackup(current, pending, replace).values);
                  setPending(null);
                  setMessage(
                    "Research restored. Other local records were preserved.",
                  );
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              Restore research
            </button>
            <button
              className="text-button"
              onClick={() => {
                setPending(null);
                setMessage("Import canceled.");
              }}
            >
              Cancel import
            </button>
          </div>
        </section>
      )}
      <p className="action-feedback" role="status">
        {previewError || message}
      </p>
    </PanelDialog>
  );
}
