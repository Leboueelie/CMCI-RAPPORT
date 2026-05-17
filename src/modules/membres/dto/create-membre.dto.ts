import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsInt,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatutMembre } from '@prisma/client';

export class CreateMembreDto {
  @ApiProperty({ description: "ID de l'assemblée", example: 'uuid-assemblee' })
  @IsString()
  @IsNotEmpty()
  assembleeId: string;

  @ApiProperty({ description: 'Nom', example: 'Kouassi' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Prénom', example: 'Jean' })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({
    description: 'Date de naissance',
    example: '1990-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateNaissance?: string;

  @ApiProperty({
    description: 'Contact',
    example: '+225 01 23 45 67 89',
    required: false,
  })
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiProperty({ description: 'Photo (URL)', required: false })
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiProperty({ description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  // Parcours spirituel
  @ApiProperty({ description: "Baptisé d'eau", example: true, required: false })
  @IsBoolean()
  @IsOptional()
  baptiseEau?: boolean;

  @ApiProperty({
    description: 'Baptisé du Saint-Esprit',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  baptiseSaintEsprit?: boolean;

  @ApiProperty({ description: 'Liens brisés', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  liensBrises?: boolean;

  @ApiProperty({
    description: 'Date de conversion (décision)',
    example: 'Mars 2020',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateConversion?: string;

  // Situation personnelle
  @ApiProperty({
    description: 'Situation matrimoniale',
    example: 'MARIE',
    required: false,
  })
  @IsString()
  @IsOptional()
  situationMatrimoniale?: string;

  @ApiProperty({ description: "Nombre d'enfants", example: 3, required: false })
  @IsInt()
  @IsOptional()
  nombreEnfants?: number;

  @ApiProperty({
    description: 'Faiseur de disciple',
    example: 'Pasteur BAMS',
    required: false,
  })
  @IsString()
  @IsOptional()
  faiseurDisciple?: string;

  @ApiProperty({
    description: 'Profession',
    example: 'Enseignant',
    required: false,
  })
  @IsString()
  @IsOptional()
  profession?: string;

  @ApiProperty({
    description: 'Niveau académique',
    example: 'Licence',
    required: false,
  })
  @IsString()
  @IsOptional()
  niveauAcademique?: string;

  // Statut simplifié
  @ApiProperty({
    description: 'Statut',
    enum: StatutMembre,
    example: 'ACTIF',
    required: false,
  })
  @IsEnum(StatutMembre)
  @IsOptional()
  statut?: StatutMembre;

  // Fonctions multiples
  @ApiProperty({
    description: 'Liste des IDs de fonctions',
    example: ['uuid-secretaire', 'uuid-semeur'],
    required: false,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fonctionIds?: string[];
}
