import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateConnectionDto {
  @ApiProperty({ type: String, example: '127.0.0.1' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ip_address?: string;

  @ApiProperty({ type: Number })
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  port?: number;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;
}
