import { ApiProperty } from '@nestjs/swagger';

// ponytail: response exposes password (matches current selectAll); drop from select when auth lands.
export class ConnectionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

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
