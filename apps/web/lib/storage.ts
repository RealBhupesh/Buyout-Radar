"use client";
import { useCallback, useEffect, useState } from "react";
export function useStored<T>(
  key: string,
  initial: T,
  validate: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(initial),
    [ready, setReady] = useState(false),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (validate(parsed)) setValue(parsed);
        else setError("Saved data was invalid and has been reset.");
      }
    } catch {
      setError("Browser storage is unavailable. Changes last for this visit.");
    }
    setReady(true);
  }, [key]); // initial and validator define the schema, not a subscription
  const update = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const result =
          typeof next === "function" ? (next as (v: T) => T)(previous) : next;
        try {
          localStorage.setItem(key, JSON.stringify(result));
          setError(null);
        } catch {
          setError(
            "Could not save in this browser. Changes last for this visit.",
          );
        }
        return result;
      });
    },
    [key],
  );
  return { value, setValue: update, ready, error };
}
export const isStringArray = (x: unknown): x is string[] =>
  Array.isArray(x) &&
  x.length <= 1000 &&
  x.every((v) => typeof v === "string" && v.length < 100);
export const isString = (x: unknown): x is string =>
  typeof x === "string" && x.length <= 50000;
