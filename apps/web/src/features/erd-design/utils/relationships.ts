import type { ErdEdge, ErdEndpoint, ErdTable } from "../api/types";

export function getRelationshipError(
  from: ErdEndpoint,
  to: ErdEndpoint,
  tables: ErdTable[],
  edges: ErdEdge[],
): string | null {
  if (from.table === to.table && from.col === to.col) {
    return "A column cannot reference itself. Choose a different parent key.";
  }

  const sourceTable = tables.find((table) => table.id === from.table);
  const targetTable = tables.find((table) => table.id === to.table);
  const source = sourceTable?.columns.find((column) => column.name === from.col);
  const target = targetTable?.columns.find((column) => column.name === to.col);
  if (!source || !target || !targetTable) {
    return "The source or target column no longer exists.";
  }
  if (!target.pk) {
    return "Connect the child column to a parent primary-key column.";
  }
  if (targetTable.columns.filter((column) => column.pk).length > 1) {
    return "Composite primary keys are not supported for connections yet.";
  }

  const sourceType = source.type.trim().toLowerCase();
  const targetType = target.type.trim().toLowerCase();
  if (!sourceType || sourceType !== targetType) {
    return "Foreign-key and parent-key datatypes must match. Edit the columns first.";
  }
  if (edges.some((edge) =>
    edge.from.table === from.table && edge.from.col === from.col &&
    edge.to.table === to.table && edge.to.col === to.col,
  )) {
    return "This foreign key already exists.";
  }
  return null;
}
