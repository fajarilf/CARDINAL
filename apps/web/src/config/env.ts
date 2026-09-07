// Single source for env-derived config. Nothing else reads process.env directly.
// Relative — next.config.ts rewrites /api/* to the NestJS API.
export const API_BASE = "/api";
