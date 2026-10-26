import type {
  DesignSummary,
  SavedDesign,
} from '@cardinal/shared-types/designs';
import { ApiProperty } from '@nestjs/swagger';
import { DesignDocumentDto } from './save-design.dto';

export class DesignSummaryDto implements DesignSummary<Date> {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  revision!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;
}

export class DesignResponseDto
  extends DesignSummaryDto
  implements SavedDesign<Date>
{
  @ApiProperty({ type: DesignDocumentDto })
  document!: DesignDocumentDto;
}
