import { ApiProperty } from '@nestjs/swagger';

export class AppSuccessResponse<T> {
  @ApiProperty({ example: 'success' })
  status!: string;

  @ApiProperty({ example: 200 })
  code!: number;

  @ApiProperty({ example: {} })
  data!: T;
}
