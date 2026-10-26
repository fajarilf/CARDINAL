import type { DesignDocument, ErdEndpoint, SavedDesign } from "../api/types";

const KEY = "cardinal:erd-design:v1";

export interface StoredDesign extends DesignDocument {
  name?: string;
  revision?: number | null;
}

const storageKey = (id?: number) => id === undefined ? KEY : `${KEY}:${id}`;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const text = (value: unknown): value is string => typeof value === "string";
const endpoint = (value: unknown): value is ErdEndpoint =>
  record(value) && text(value.table) && text(value.col);

function isStoredDesign(value: unknown): value is StoredDesign {
  if (!record(value) || !Array.isArray(value.tables) || !Array.isArray(value.edges)) return false;
  if (value.name !== undefined && !text(value.name)) return false;
  if (value.revision !== undefined && value.revision !== null &&
      !(Number.isInteger(value.revision) && Number(value.revision) > 0)) return false;
  return value.tables.every((table: unknown) =>
    record(table) && text(table.id) && text(table.name) &&
    typeof table.x === "number" && Number.isFinite(table.x) &&
    typeof table.y === "number" && Number.isFinite(table.y) &&
    Array.isArray(table.columns) && table.columns.every((column: unknown) =>
      record(column) && text(column.name) && text(column.type) &&
      (column.pk === undefined || typeof column.pk === "boolean") &&
      (column.fk === undefined || typeof column.fk === "boolean"),
    ),
  ) && value.edges.every((edge: unknown) =>
    record(edge) && text(edge.id) && endpoint(edge.from) && endpoint(edge.to),
  );
}

export function matchesSavedDesign(draft: StoredDesign, saved: Pick<SavedDesign, "name" | "document">): boolean {
  const canonical = (value: unknown) => JSON.stringify(value, (_key, item: unknown) =>
    record(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item,
  );
  return (draft.name ?? "Untitled design") === saved.name &&
    canonical({ tables: draft.tables, edges: draft.edges }) === canonical(saved.document);
}

export function loadDesign(id?: number): StoredDesign | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredDesign(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDesign(doc: StoredDesign, id?: number): void {
  localStorage.setItem(storageKey(id), JSON.stringify(doc));
}

export function removeDesignDraft(id?: number): void {
  localStorage.removeItem(storageKey(id));
}

export function downloadJson(tables: DesignDocument["tables"], edges: DesignDocument["edges"]): void {
  const blob = new Blob([JSON.stringify({ tables, edges }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cardinal-design.json";
  a.click();
  URL.revokeObjectURL(url);
}
