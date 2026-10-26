import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { loadDesign, matchesSavedDesign, removeDesignDraft, saveDesign } from "./storage.ts";

const doc = { tables: [], edges: [] };
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

afterEach(() => {
  mock.restoreAll();
  if (originalStorage) {
    Object.defineProperty(globalThis, "localStorage", originalStorage);
  } else {
    delete globalThis.localStorage;
  }
});

function setStorage(storage) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
}

function memoryStorage() {
  const values = new Map();
  setStorage({
    setItem: (key, value) => values.set(key, value),
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
  });
  return values;
}

test("drafts are isolated by design ID without losing the legacy new-design draft", () => {
  memoryStorage();
  const first = { ...doc, name: "First", revision: 2 };
  const second = { ...doc, name: "Second", revision: 1 };
  saveDesign(doc);
  saveDesign(first, 1);
  saveDesign(second, 2);
  assert.deepEqual(loadDesign(), doc);
  assert.deepEqual(loadDesign(1), first);
  assert.deepEqual(loadDesign(2), second);
  removeDesignDraft(1);
  assert.equal(loadDesign(1), null);
  assert.deepEqual(loadDesign(2), second);
  assert.deepEqual(loadDesign(), doc);
});

test("malformed documents cannot crash the editor during draft recovery", () => {
  const values = memoryStorage();
  for (const invalid of [
    { tables: [null], edges: [] },
    { tables: [], edges: [{ id: "e", from: null, to: {} }] },
    { ...doc, revision: "1" },
    { ...doc, name: 42 },
    { tables: [{ id: "t", name: "t", x: 0, y: 0, columns: [null] }], edges: [] },
  ]) {
    values.set("cardinal:erd-design:v1", JSON.stringify(invalid));
    assert.equal(loadDesign(), null);
  }
});

test("draft recovery ignores JSON key ordering and revision-only differences", () => {
  const draft = { tables: [{ id: "t", name: "users", x: 0, y: 0, columns: [] }], edges: [], name: "Shop", revision: 1 };
  const saved = { name: "Shop", revision: 2, document: { edges: [], tables: [{ columns: [], y: 0, x: 0, name: "users", id: "t" }] } };
  assert.equal(matchesSavedDesign(draft, saved), true);
  assert.equal(matchesSavedDesign({ ...draft, name: "Renamed" }, saved), false);
  assert.equal(matchesSavedDesign({ ...draft, tables: [] }, saved), false);
});

test("saved designs can be loaded again", () => {
  const values = new Map();
  setStorage({
    setItem: (key, value) => values.set(key, value),
    getItem: (key) => values.get(key) ?? null,
  });

  saveDesign(doc);

  assert.deepEqual(loadDesign(), doc);
});

test("save failures reach the caller instead of being hidden", () => {
  const error = new Error("Storage quota exceeded");
  setStorage({
    setItem() {
      throw error;
    },
  });

  assert.throws(() => saveDesign(doc), (caught) => caught === error);
});

test("unavailable storage does not claim a successful save", () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("Storage unavailable");
    },
  });

  assert.throws(() => saveDesign(doc), /Storage unavailable/);
});
