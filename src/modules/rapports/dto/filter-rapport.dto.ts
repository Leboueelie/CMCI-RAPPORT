import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutRapport } from '@prisma/client';

export class FilterRapportDto {
  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    enum: StatutRapport,
  })
  @IsEnum(StatutRapport)
  @IsOptional()
  statut?: StatutRapport;

  @ApiPropertyOptional({ description: 'Filtrer par assemblée ID' })
  @IsString()
  @IsOptional()
  assembleeId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par territoire ID' })
  @IsString()
  @IsOptional()
  territoireId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par période' })
  @IsString()
  @IsOptional()
  periode?: string;

  @ApiPropertyOptional({ description: 'Date de début (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @ApiPropertyOptional({ description: 'Date de fin (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @ApiPropertyOptional({ description: 'Page', example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Nombre par page', example: 20 })
  @IsOptional()
  limit?: number = 20;
}
