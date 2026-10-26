import type { DesignDocument } from '@cardinal/shared-types/designs';
import { BadRequestException } from '@nestjs/common';

export function validateDesign(document: DesignDocument): void {
  const tables = new Map<string, Set<string>>();
  const tableNames = new Set<string>();
  for (const table of document.tables) {
    if (tables.has(table.id) || tableNames.has(table.name.trim())) {
      throw new BadRequestException('Table IDs and names must be unique.');
    }
    const columns = new Set(table.columns.map((column) => column.name.trim()));
    if (columns.size !== table.columns.length) {
      throw new BadRequestException(
        `Column names must be unique in ${table.name}.`,
      );
    }
    tables.set(table.id, new Set(table.columns.map((column) => column.name)));
    tableNames.add(table.name.trim());
  }

  const edgeIds = new Set<string>();
  const relationships = new Set<string>();
  for (const edge of document.edges) {
    if (
      !tables.get(edge.from.table)?.has(edge.from.col) ||
      !tables.get(edge.to.table)?.has(edge.to.col)
    ) {
      throw new BadRequestException(
        'A relationship references a missing table or column.',
      );
    }
    if (edge.from.table === edge.to.table && edge.from.col === edge.to.col) {
      throw new BadRequestException('A column cannot reference itself.');
    }
    const key = JSON.stringify([
      edge.from.table,
      edge.from.col,
      edge.to.table,
      edge.to.col,
    ]);
    if (edgeIds.has(edge.id) || relationships.has(key)) {
      throw new BadRequestException(
        'Relationship IDs and directed connections must be unique.',
      );
    }
    edgeIds.add(edge.id);
    relationships.add(key);
  }
}
