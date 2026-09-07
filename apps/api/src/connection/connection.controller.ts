import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConnectionService } from './connection.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { EditConnectionDto } from './dto/edit-connection.dto';
import { ConnectionResponseDto } from './dto/connection-response.dto';
import { AppErrorResponse } from '../dto/app-error-response.dto';
import { ApiEnvelope } from '../common/api-envelope';

@ApiTags('connections')
@Controller('connections')
export class ConnectionController {
  constructor(private readonly service: ConnectionService) {}

  @Post()
  @ApiEnvelope(ConnectionResponseDto, { status: 201 })
  create(@Body() dto: CreateConnectionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiEnvelope(ConnectionResponseDto, { isArray: true })
  findAll() {
    return this.service.getAll();
  }

  @Get(':id')
  @ApiEnvelope(ConnectionResponseDto)
  @ApiNotFoundResponse({ type: AppErrorResponse })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiEnvelope(ConnectionResponseDto)
  @ApiNotFoundResponse({ type: AppErrorResponse })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditConnectionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: AppErrorResponse })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
