import { PartialType } from '@nestjs/swagger';
import { CreateConnectionDto } from './create-connection.dto';

export class EditConnectionDto extends PartialType(CreateConnectionDto) {}
