import type { ConnectionRequest } from '@cardinal/shared-types/connections';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { DATABASE } from '../connections.type';

export class CreateConnectionDto implements ConnectionRequest {
  @ApiProperty({ type: String, example: '127.0.0.1' })
  @IsString()
  @IsNotEmpty()
  ip_address!: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: DATABASE, example: DATABASE.postgresql })
  @IsEnum(DATABASE)
  database!: DATABASE;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  database_name!: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  port!: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
