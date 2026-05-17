import { PartialType } from '@nestjs/swagger';
import { CreateAssembleeDto } from './create-assemblee.dto';

export class UpdateAssembleeDto extends PartialType(CreateAssembleeDto) {}
