import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiEnvelope } from '../common/api-envelope';
import { DesignsService } from './designs.service';
import { CreateDesignDto, UpdateDesignDto } from './dto/save-design.dto';
import { DesignResponseDto, DesignSummaryDto } from './dto/design-response.dto';

@ApiTags('designs')
@Controller('designs')
export class DesignsController {
  constructor(private readonly service: DesignsService) {}

  @Get()
  @ApiEnvelope(DesignSummaryDto, { isArray: true })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiEnvelope(DesignResponseDto)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiEnvelope(DesignResponseDto, { status: 201 })
  create(@Body() dto: CreateDesignDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiEnvelope(DesignResponseDto)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDesignDto) {
    return this.service.update(id, dto);
  }
}
