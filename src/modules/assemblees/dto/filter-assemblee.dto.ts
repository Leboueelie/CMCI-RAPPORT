import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterAssembleeDto {
  @ApiPropertyOptional({ description: 'Recherche par nom' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrer par territoire ID' })
  @IsString()
  @IsOptional()
  territoireId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par dirigeant ID' })
  @IsString()
  @IsOptional()
  dirigeantId?: string;

  @ApiPropertyOptional({ description: 'Page', example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Nombre par page', example: 20 })
  @IsOptional()
  limit?: number = 20;
}
