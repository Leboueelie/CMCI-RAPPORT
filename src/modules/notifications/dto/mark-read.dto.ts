import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkReadDto {
  @ApiPropertyOptional({
    description: 'Marquer comme lu (true) ou non-lu (false)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean = true;
}
