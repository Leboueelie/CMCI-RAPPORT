import { PartialType } from '@nestjs/swagger';
import { CreateMembreDto } from './create-membre.dto';

export class UpdateMembreDto extends PartialType(CreateMembreDto) {}
