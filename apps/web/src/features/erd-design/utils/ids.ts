export function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // ponytail: Math.random fallback for older browsers without crypto.randomUUID
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
