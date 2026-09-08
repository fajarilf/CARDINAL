import type { ErdEdge as Edge, ErdTable } from "../api/types";
import { BOX_W, FOOT, HEAD_H, ROW_H, SP, TICK, colIndex } from "../utils/geometry";

type EdgeState = "idle" | "active" | "dim";

export function ErdEdge({
  edge,
  byId,
  state,
}: {
  edge: Edge;
  byId: (id: string) => ErdTable | undefined;
  state: EdgeState;
}) {
  const s = byId(edge.from.table); // FK / many side
  const t = byId(edge.to.table); // PK / one side
  if (!s || !t) return null;

  const sCx = s.x + BOX_W / 2;
  const tCx = t.x + BOX_W / 2;
  const sRow = colIndex(s, edge.from.col);
  const tRow = colIndex(t, edge.to.col);
  const sy = s.y + HEAD_H + (sRow + 0.5) * ROW_H;
  const ty = t.y + HEAD_H + (tRow + 0.5) * ROW_H;

  const sRight = tCx >= sCx; // source exits right?
  const ax1 = sRight ? s.x + BOX_W : s.x; // source anchor x
  const ax2 = sRight ? t.x : t.x + BOX_W; // target anchor x
  const sSign = sRight ? 1 : -1; // crow's-foot direction
  const tSign = sRight ? -1 : 1; // tick sits outside target box
  const midX = (ax1 + ax2) / 2;

  const path = `M ${ax1} ${sy} H ${midX} V ${ty} H ${ax2}`;

  // crow's foot at source (many)
  const ftx = ax1 + FOOT * sSign;
  const foot = `M ${ftx} ${sy} L ${ax1} ${sy - SP} M ${ftx} ${sy} L ${ax1} ${sy} M ${ftx} ${sy} L ${ax1} ${sy + SP}`;
  // one-tick at target
  const tkx = ax2 + TICK * tSign;
  const tick = `M ${tkx} ${ty - SP} L ${tkx} ${ty + SP}`;

  const stroke =
    state === "active"
      ? "stroke-clay [stroke-width:1.9]"
      : "stroke-ink [stroke-width:1.5]";
  const opacity = state === "dim" ? "opacity-15" : "";

  return (
    <g className={`transition-[stroke] duration-200 motion-reduce:transition-none ${opacity}`}>
      <path className={stroke} d={path} fill="none" vectorEffect="non-scaling-stroke" />
      <path className={stroke} d={foot} fill="none" vectorEffect="non-scaling-stroke" />
      <path className={stroke} d={tick} fill="none" vectorEffect="non-scaling-stroke" />
    </g>
  );
}
