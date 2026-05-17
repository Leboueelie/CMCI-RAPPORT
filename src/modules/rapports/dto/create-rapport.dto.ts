import {
  IsString,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRapportDto {
  @ApiProperty({ description: "ID de l'assemblée", example: 'uuid-assemblee' })
  @IsString()
  @IsNotEmpty()
  assembleeId: string;

  @ApiProperty({ description: 'ID du territoire', example: 'uuid-territoire' })
  @IsString()
  @IsNotEmpty()
  territoireId: string;

  @ApiProperty({ description: 'Période du rapport', example: 'Mai 2026' })
  @IsString()
  @IsNotEmpty()
  periode: string;

  @ApiProperty({ description: 'Date de début', example: '2026-05-01' })
  @IsDateString()
  @IsNotEmpty()
  dateDebut: string;

  @ApiProperty({ description: 'Date de fin', example: '2026-05-31' })
  @IsDateString()
  @IsNotEmpty()
  dateFin: string;

  @ApiProperty({
    description: 'Activités réalisées',
    example: 'Cultes dominicaux, études bibliques, visites',
  })
  @IsString()
  @IsNotEmpty()
  activites: string;

  @ApiProperty({ description: "Nombre d'effectifs", example: 45 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  effectifs: number;

  @ApiProperty({
    description: 'Témoignages',
    example: '3 nouvelles conversions',
    required: false,
  })
  @IsString()
  @IsOptional()
  temoignages?: string;

  @ApiProperty({
    description: 'Problèmes rencontrés',
    example: 'Manque de sièges',
    required: false,
  })
  @IsString()
  @IsOptional()
  problemes?: string;

  @ApiProperty({
    description: 'Besoins',
    example: 'Bibles, chaises',
    required: false,
  })
  @IsString()
  @IsOptional()
  besoins?: string;

  @ApiProperty({
    description: 'Recommandations',
    example: "Organiser une campagne d'évangélisation",
    required: false,
  })
  @IsString()
  @IsOptional()
  recommandations?: string;

  @ApiProperty({
    description: 'Fichier joint (URL)',
    example: 'https://.../rapport.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  fichierJoint?: string;
}
