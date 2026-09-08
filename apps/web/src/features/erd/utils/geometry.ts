import type { ErdTable } from "../api/types";

export const BOX_W = 214;
export const HEAD_H = 37;
export const ROW_H = 27;
export const FOOT = 12; // crow's-foot length
export const SP = 6; // prong spread
export const TICK = 9; // "one" tick offset

export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export const tableHeight = (t: ErdTable) => HEAD_H + t.columns.length * ROW_H;

export const colIndex = (t: ErdTable, name: string) =>
  t.columns.findIndex((c) => c.name === name);
