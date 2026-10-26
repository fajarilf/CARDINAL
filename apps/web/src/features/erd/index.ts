export { default as CardinalErd } from "./components/cardinal-erd";

// Reusable rendering primitives — consumed by the erd-design feature too.
export { ErdNode } from "./components/erd-node";
export { ErdEdge } from "./components/erd-edge";
export { ErdSidebar } from "./components/erd-sidebar";
export { ErdLegend } from "./components/erd-legend";
export {
  BOX_W,
  HEAD_H,
  ROW_H,
  FOOT,
  SP,
  TICK,
  clamp,
  tableHeight,
  colIndex,
} from "./utils/geometry";
export type {
  Engine,
  ErdColumn,
  ErdTable,
  ErdEndpoint,
  ErdEdge as ErdEdgeData,
  ErdSchema,
} from "./api/types";
