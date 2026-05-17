import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutMembre } from '@prisma/client';

export class FilterMembreDto {
  @ApiPropertyOptional({ description: 'Recherche par nom ou prénom' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    enum: StatutMembre,
  })
  @IsEnum(StatutMembre)
  @IsOptional()
  statut?: StatutMembre;

  @ApiPropertyOptional({ description: 'Filtrer par assemblée' })
  @IsString()
  @IsOptional()
  assembleeId?: string;

  @ApiPropertyOptional({ description: 'Page', example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Nombre par page', example: 20 })
  @IsOptional()
  limit?: number = 20;
}
