import type { ConnectionResponse } from '@cardinal/shared-types/connections';
import { ApiProperty } from '@nestjs/swagger';
import { DATABASE } from '../connections.type';

// ponytail: response exposes password (matches current selectAll); drop from select when auth lands.
export class ConnectionResponseDto implements ConnectionResponse<Date> {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'analytic-warehouse' })
  name!: string | null;

  @ApiProperty({ example: DATABASE.mysql })
  database!: DATABASE;

  @ApiProperty({ example: 'warehouse-db' })
  database_name!: string;

  @ApiProperty({ example: '127.0.0.1' })
  ip_address!: string;

  @ApiProperty({ example: 5432 })
  port!: number;

  @ApiProperty({ example: 'postgres' })
  username!: string;

  @ApiProperty({ example: 'secret' })
  password!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;
}
