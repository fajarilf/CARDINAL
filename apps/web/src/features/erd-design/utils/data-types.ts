export const COMMON_DATA_TYPES = [
  "smallint",
  "integer",
  "bigint",
  "decimal",
  "float",
  "double",
  "varchar",
  "text",
  "boolean",
  "date",
  "time",
  "timestamp",
  "uuid",
  "json",
  "binary",
] as const;

export function getDataTypeOptions(query: string, current: string): string[] {
  const options: string[] = [...COMMON_DATA_TYPES];
  if (current && !options.includes(current)) options.unshift(current);
  const search = query.trim().toLowerCase();
  return options.filter((type) => type.toLowerCase().includes(search));
}
