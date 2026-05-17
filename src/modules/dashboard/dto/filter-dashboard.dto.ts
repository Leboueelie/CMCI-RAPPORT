import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterDashboardDto {
  @ApiPropertyOptional({
    description: 'Date de début (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @ApiPropertyOptional({
    description: 'Date de fin (YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @ApiPropertyOptional({ description: 'Filtrer par territoire ID' })
  @IsString()
  @IsOptional()
  territoireId?: string;
}
