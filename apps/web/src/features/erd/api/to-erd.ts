import { BOX_W, HEAD_H, ROW_H } from "../utils/geometry";
import type {
  ApiIntrospectionSchema,
  ApiIntrospectionTable,
  ErdEdge,
  ErdSchema,
  ErdTable,
} from "./types";

const GAP_X = 90;
const GAP_Y = 60;
const PAD = 40;

// Column-packed grid: each table drops into the currently-shortest column.
function layout(tables: ApiIntrospectionTable[]): Map<string, { x: number; y: number }> {
  const cols = Math.max(1, Math.ceil(Math.sqrt(tables.length)));
  const colY = new Array<number>(cols).fill(PAD);
  const pos = new Map<string, { x: number; y: number }>();

  for (const t of tables) {
    let c = 0;
    for (let j = 1; j < cols; j++) if (colY[j] < colY[c]) c = j;
    pos.set(t.name, { x: PAD + c * (BOX_W + GAP_X), y: colY[c] });
    colY[c] += HEAD_H + t.columns.length * ROW_H + GAP_Y;
  }
  return pos;
}

export function toErdSchema(api: ApiIntrospectionSchema): ErdSchema {
  const pos = layout(api.tables);
  const fkCols = new Set(
    api.foreign_keys.map((fk) => `${fk.source_table}.${fk.source_column}`),
  );

  const tables: ErdTable[] = api.tables.map((t) => {
    const { x, y } = pos.get(t.name) ?? { x: PAD, y: PAD };
    return {
      id: t.name,
      name: t.name,
      x,
      y,
      columns: t.columns.map((c) => ({
        name: c.name,
        type: c.data_type,
        pk: c.is_primary_key || undefined,
        fk: fkCols.has(`${t.name}.${c.name}`) || undefined,
      })),
    };
  });

  const seen = new Set<string>();
  const edges: ErdEdge[] = api.foreign_keys.flatMap((fk) => {
    const id = `${fk.source_table}.${fk.source_column}->${fk.target_table}.${fk.target_column}`;
    if (seen.has(id)) return [];
    seen.add(id);
    return [
      {
        id,
        from: { table: fk.source_table, col: fk.source_column },
        to: { table: fk.target_table, col: fk.target_column },
      },
    ];
  });

  return { schema: api.schema, tables, edges };
}
