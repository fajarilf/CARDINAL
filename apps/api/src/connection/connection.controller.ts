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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConnectionService } from './connection.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { EditConnectionDto } from './dto/edit-connection.dto';
import { ConnectionResponseDto } from './dto/connection-response.dto';

@ApiTags('connections')
@Controller('connections')
export class ConnectionController {
  constructor(private readonly service: ConnectionService) {}

  @Post()
  @ApiCreatedResponse({ type: ConnectionResponseDto })
  create(@Body() dto: CreateConnectionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [ConnectionResponseDto] })
  findAll() {
    return this.service.getAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: ConnectionResponseDto })
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ConnectionResponseDto })
  @ApiNotFoundResponse()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditConnectionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
