import { ApiProperty } from '@nestjs/swagger';

export class AppErrorResponse {
  @ApiProperty({ example: 'success' })
  status!: string;

  @ApiProperty({ example: 404 })
  code!: number;

  @ApiProperty({ example: 'resource not found' })
  message!: string;
}
