export type DatabaseId = 0 | 1;

export interface ConnectionRequest {
  ip_address: string;
  name?: string;
  database: DatabaseId;
  database_name: string;
  port: number;
  username: string;
  password: string;
}

export interface ConnectionResponse<TDate = string> {
  id: number;
  name: string | null;
  database: DatabaseId;
  database_name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  created_at: TDate;
  updated_at: TDate;
}
