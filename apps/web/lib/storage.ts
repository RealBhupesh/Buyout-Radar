"use client";
import { useCallback, useEffect, useState } from "react";
type Snapshot = { value: unknown; error: string | null; invalid?: boolean };
const memory = new Map<string, Snapshot>();
const listeners = new Map<string, Set<() => void>>();
function publish(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}
export function readStored<T>(
  key: string,
  initial: T,
  validate: (x: unknown) => x is T,
): { value: T; error: string | null } {
  let snapshot = memory.get(key);
  if (!snapshot) {
    try {
      const raw = localStorage.getItem(key);
      const parsed: unknown = raw === null ? initial : JSON.parse(raw);
      snapshot = validate(parsed)
        ? { value: parsed, error: null }
        : {
            value: initial,
            invalid: true,
            error:
              "Saved data was invalid. Defaults are shown; the original remains in browser storage.",
          };
    } catch {
      snapshot = {
        value: initial,
        error: "Browser storage is unavailable. Changes last for this visit.",
      };
    }
    memory.set(key, snapshot);
  }
  return { value: snapshot.value as T, error: snapshot.error };
}
export function writeStored(key: string, value: unknown): string | null {
  let error: string | null = null;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    error = "Could not save in this browser. Changes last for this visit.";
  }
  memory.set(key, { value, error });
  publish(key);
  return error;
}
export function storageValues(): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  // Never silently export an incomplete backup if storage cannot be read.
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (key.startsWith("buyout:"))
      values[key] = JSON.parse(localStorage.getItem(key)!);
  }
  for (const [key, snapshot] of memory) {
    if (snapshot.invalid)
      throw new Error(
        `Cannot back up invalid saved data: ${key}. Correct the record before exporting.`,
      );
    values[key] = snapshot.value;
  }
  return values;
}
export function restoreValues(values: Record<string, unknown>): void {
  const previous = new Map<string, string | null>();
  for (const key of Object.keys(values))
    previous.set(key, localStorage.getItem(key));
  const written: string[] = [];
  try {
    for (const [key, value] of Object.entries(values)) {
      localStorage.setItem(key, JSON.stringify(value));
      written.push(key);
    }
  } catch {
    let rollbackFailed = false;
    for (const key of written.reverse())
      try {
        const value = previous.get(key)!;
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {
        rollbackFailed = true;
      }
    if (rollbackFailed) {
      for (const key of previous.keys()) {
        memory.delete(key);
        publish(key);
      }
      throw new Error(
        "Restore failed and browser storage could not be fully rolled back. Export a backup and check your research before retrying.",
      );
    }
    throw new Error(
      "Restore could not be saved. Your previous research has been preserved.",
    );
  }
  for (const [key, value] of Object.entries(values)) {
    memory.set(key, { value, error: null });
    publish(key);
  }
}
let listening = false;
function listenForExternalChanges() {
  if (listening) return;
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.storageArea !== null && e.storageArea !== localStorage) return;
    if (e.key === null) {
      memory.clear();
      for (const key of listeners.keys()) publish(key);
    } else {
      memory.delete(e.key);
      publish(e.key);
    }
  });
  listening = true;
}
export function useStored<T>(
  key: string,
  initial: T,
  validate: (value: unknown) => value is T,
) {
  const [snapshot, setSnapshot] = useState({
    value: initial,
    ready: false,
    error: null as string | null,
  });
  useEffect(() => {
    const sync = () =>
      setSnapshot({ ...readStored(key, initial, validate), ready: true });
    const group = listeners.get(key) ?? new Set<() => void>();
    group.add(sync);
    listeners.set(key, group);
    listenForExternalChanges();
    sync();
    return () => {
      group.delete(sync);
      if (!group.size) listeners.delete(key);
    };
  }, [key]);
  const update = useCallback(
    (next: T | ((previous: T) => T)) => {
      const prev = readStored(key, initial, validate).value;
      const value =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeStored(key, value);
    },
    [key],
  );
  return { ...snapshot, setValue: update };
}
export const isStringArray = (x: unknown): x is string[] =>
  Array.isArray(x) &&
  x.length <= 1000 &&
  x.every((v) => typeof v === "string" && v.length < 100);
export const isString = (x: unknown): x is string =>
  typeof x === "string" && x.length <= 50000;
