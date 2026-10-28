import { afterEach, expect, it, vi } from "vitest";
import {
  readStored,
  writeStored,
  restoreValues,
  storageValues,
  isString,
} from "../apps/web/lib/storage";
function mockStorage() {
  const data = new Map<string, string>();
  const storage = {
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => {
      data.set(k, v);
    }),
    removeItem: vi.fn((k: string) => {
      data.delete(k);
    }),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
  vi.stubGlobal("localStorage", storage);
  return { data, storage };
}
afterEach(() => vi.unstubAllGlobals());
it("retains session updates when storage writes fail", () => {
  const { storage } = mockStorage();
  storage.setItem.mockImplementation(() => {
    throw new Error("quota");
  });
  expect(writeStored("storage-test-session", "private note")).toMatch(
    /Could not save/,
  );
  expect(readStored("storage-test-session", "", isString)).toMatchObject({
    value: "private note",
    error: expect.stringMatching(/Could not save/),
  });
});
it("rolls back already-written keys on a partial restore without altering session state", () => {
  const { data, storage } = mockStorage();
  data.set("storage-test-first", '"before"');
  writeStored("storage-test-first", "before");
  const original = storage.setItem.getMockImplementation()!;
  storage.setItem.mockImplementation((k, v) => {
    if (k === "storage-test-fail") throw new Error("quota");
    original(k, v);
  });
  expect(() =>
    restoreValues({
      "storage-test-first": "imported",
      "storage-test-fail": "new",
    }),
  ).toThrow(/previous research has been preserved/);
  expect(data.get("storage-test-first")).toBe('"before"');
  expect(data.has("storage-test-fail")).toBe(false);
  expect(readStored("storage-test-first", "", isString).value).toBe("before");
});
it("a failure on the first restore write does not falsely report a rollback failure", () => {
  const { storage } = mockStorage();
  storage.setItem.mockImplementation(() => {
    throw new Error("quota");
  });
  expect(() => restoreValues({ "storage-test-first-fail": "new" })).toThrow(
    /previous research has been preserved/,
  );
});
it("invalid stored records cannot silently become an export of defaults", () => {
  const { data } = mockStorage();
  data.set("storage-test-invalid", "123");
  expect(readStored("storage-test-invalid", "", isString).error).toMatch(
    /invalid/,
  );
  expect(() => storageValues()).toThrow(/invalid saved data/);
});
