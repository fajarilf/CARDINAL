import { DATABASE } from "./types";
import type { ApiConnection, Connection, ConnectionRequest, Draft } from "./types";

export function toConnection(row: ApiConnection): Connection {
  return {
    id: String(row.id),
    name: row.name ?? "(unnamed)",
    engine: row.database === 0 ? "mysql" : "postgresql",
    host: row.ip_address,
    port: String(row.port),
    database: row.database_name,
    user: row.username,
    password: row.password,
    tables: null, // not provided by the API
    // ponytail: plain date; swap for a relative formatter if the design's "2h ago" matters
    lastSynced: new Date(row.updated_at).toLocaleDateString(),
    current: false,
  };
}

export function toRequest(d: Draft): ConnectionRequest {
  return {
    ip_address: d.host.trim(),
    name: d.name.trim(),
    database: d.engine === "mysql" ? DATABASE.mysql : DATABASE.postgresql,
    database_name: d.database.trim(),
    port: Number(d.port) || 0,
    username: d.user.trim(),
    password: d.password,
  };
}
