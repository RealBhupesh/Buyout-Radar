"use client";
import { useState } from "react";
import type { BuyBox } from "../lib/research";
import { useStored } from "../lib/storage";
import { KEYS, isScreens, isBuyBox, type SavedScreen } from "../lib/workflow";
import { PanelDialog } from "./dialog";
export function SavedScreens({
  box,
  onLoad,
}: {
  box: BuyBox;
  onLoad: (box: BuyBox) => void;
}) {
  const screens = useStored<SavedScreen[]>(KEYS.screens, [], isScreens);
  const [name, setName] = useState(""),
    [message, setMessage] = useState("");
  return (
    <PanelDialog
      title="Saved screens"
      description="Keep named screening criteria in this browser. Loading replaces the current filters."
      trigger={<button className="button tonal">Saved screens</button>}
    >
      <form
        className="workflow-form"
        onSubmit={(e) => {
          e.preventDefault();
          const n = name.trim();
          if (!n || !isBuyBox(box)) return;
          screens.setValue((p) => [
            ...p,
            { id: crypto.randomUUID(), name: n, box: { ...box } },
          ]);
          setName("");
          setMessage("Current screen saved.");
        }}
      >
        <label>
          Screen name
          <input
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          className="button primary"
          disabled={!screens.ready || !isBuyBox(box)}
        >
          Save current screen
        </button>
      </form>
      {!isBuyBox(box) && (
        <p role="alert" className="error-text">
          Correct the Buy Box criteria before saving a screen.
        </p>
      )}
      <div className="workflow-list">
        {screens.value.map((s) => (
          <ScreenRow
            key={s.id}
            screen={s}
            onLoad={() => {
              onLoad({ ...s.box });
              setMessage(`${s.name} loaded.`);
            }}
            onRename={(name) =>
              screens.setValue((p) =>
                p.map((x) => (x.id === s.id ? { ...x, name } : x)),
              )
            }
            onDelete={() => {
              screens.setValue((p) => p.filter((x) => x.id !== s.id));
              setMessage(`${s.name} deleted.`);
            }}
          />
        ))}
      </div>
      {!screens.value.length && (
        <p className="fine-print">
          No saved screens yet. Your current Buy Box will be captured when you
          save.
        </p>
      )}
      <p role="status" className="action-feedback">
        {screens.error || message}
      </p>
    </PanelDialog>
  );
}
function ScreenRow({
  screen,
  onLoad,
  onRename,
  onDelete,
}: {
  screen: SavedScreen;
  onLoad: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false),
    [name, setName] = useState(screen.name);
  return (
    <div className="workflow-row">
      <div>
        {editing ? (
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                onRename(name.trim());
                setEditing(false);
              }
            }}
          >
            <input
              aria-label="Rename screen"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="text-button">Save name</button>
            <button
              type="button"
              className="text-button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <strong>{screen.name}</strong>
        )}
        <p className="fine-print">
          {screen.box.sector} ·{" "}
          {screen.box.sort === "irr"
            ? "Model IRR"
            : screen.box.sort === "conversion"
              ? "Cash conversion"
              : "Market cap"}
        </p>
      </div>
      <div className="workflow-actions">
        <button
          className="text-button"
          onClick={onLoad}
          aria-label={`Load screen ${screen.name}`}
        >
          Load
        </button>
        <button
          className="text-button"
          onClick={() => {
            setName(screen.name);
            setEditing(true);
          }}
          aria-label={`Rename screen ${screen.name}`}
        >
          Rename
        </button>
        <button
          className="text-button"
          onClick={onDelete}
          aria-label={`Delete screen ${screen.name}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
