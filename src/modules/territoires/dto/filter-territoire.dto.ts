import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NiveauTerritoire } from '@prisma/client';

export class FilterTerritoireDto {
  @ApiPropertyOptional({ description: 'Recherche par nom' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par niveau',
    enum: NiveauTerritoire,
  })
  @IsEnum(NiveauTerritoire)
  @IsOptional()
  niveau?: NiveauTerritoire;

  @ApiPropertyOptional({ description: 'Filtrer par parent ID' })
  @IsString()
  @IsOptional()
  parentId?: string;
}
