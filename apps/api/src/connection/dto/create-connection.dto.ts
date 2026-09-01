import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateConnectionDto {
  @ApiProperty({ type: String, example: '127.0.0.1' })
  @IsString()
  @IsNotEmpty()
  ip_address!: string;

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
