import { BOX_W, HEAD_H, ROW_H, tableHeight } from "@/features/erd";
import type { ErdEndpoint, ErdTable } from "../api/types";

// worldX/worldY are canvas-space coordinates (already divided by zoom, minus pan).
export function hitTestColumn(
  worldX: number,
  worldY: number,
  tables: ErdTable[],
): ErdEndpoint | null {
  for (const t of tables) {
    if (worldX < t.x || worldX > t.x + BOX_W) continue;
    if (worldY < t.y || worldY > t.y + tableHeight(t)) continue;
    if (worldY < t.y + HEAD_H) continue; // header, not a column row
    const row = Math.floor((worldY - t.y - HEAD_H) / ROW_H);
    const col = t.columns[row];
    if (!col) continue;
    return { table: t.id, col: col.name };
  }
  return null;
}
