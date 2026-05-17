import { PartialType } from '@nestjs/swagger';
import { CreateTerritoireDto } from './create-territoire.dto';

export class UpdateTerritoireDto extends PartialType(CreateTerritoireDto) {}
