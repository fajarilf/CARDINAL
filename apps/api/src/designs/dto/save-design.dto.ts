import type {
  CreateDesignRequest,
  DesignDocument,
  UpdateDesignRequest,
} from '@cardinal/shared-types/designs';
import type {
  ErdColumn,
  ErdEdge,
  ErdEndpoint,
  ErdTable,
} from '@cardinal/shared-types/erd';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsInt,
  IsNumber,
  IsObject,
  ValidateIf,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DesignColumnDto implements ErdColumn {
  @IsString()
  @Matches(/\S/)
  @MaxLength(128)
  name!: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(128)
  type!: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  pk?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  fk?: boolean;
}

export class DesignTableDto implements ErdTable {
  @IsString()
  @Matches(/\S/)
  @MaxLength(128)
  id!: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(128)
  name!: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  x!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  y!: number;

  @IsArray()
  @IsObject({ each: true })
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => DesignColumnDto)
  columns!: DesignColumnDto[];
}

export class DesignEndpointDto implements ErdEndpoint {
  @IsString()
  @Matches(/\S/)
  @MaxLength(128)
  table!: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(128)
  col!: string;
}

export class DesignEdgeDto implements ErdEdge {
  @IsString()
  @Matches(/\S/)
  @MaxLength(128)
  id!: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => DesignEndpointDto)
  from!: DesignEndpointDto;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => DesignEndpointDto)
  to!: DesignEndpointDto;
}

export class DesignDocumentDto implements DesignDocument {
  @IsArray()
  @IsObject({ each: true })
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => DesignTableDto)
  tables!: DesignTableDto[];

  @IsArray()
  @IsObject({ each: true })
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => DesignEdgeDto)
  edges!: DesignEdgeDto[];
}

export class CreateDesignDto implements CreateDesignRequest {
  @ApiProperty({ example: 'Shop schema', maxLength: 128 })
  @IsString()
  @Matches(/\S/)
  @MaxLength(128)
  name!: string;

  @ApiProperty({ type: DesignDocumentDto })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => DesignDocumentDto)
  document!: DesignDocumentDto;
}

export class UpdateDesignDto
  extends CreateDesignDto
  implements UpdateDesignRequest
{
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  revision!: number;
}
