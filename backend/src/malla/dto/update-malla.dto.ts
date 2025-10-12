import { PartialType } from '@nestjs/swagger';
import { CreateMallaDto } from './create-malla.dto';

export class UpdateMallaDto extends PartialType(CreateMallaDto) {}
