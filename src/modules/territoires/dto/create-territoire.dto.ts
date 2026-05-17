import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NiveauTerritoire } from '@prisma/client';

export class CreateTerritoireDto {
  @ApiProperty({ description: 'Nom du territoire', example: 'Daloa Centre' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'Niveau hiérarchique',
    enum: NiveauTerritoire,
    example: 'VILLE',
  })
  @IsEnum(NiveauTerritoire)
  @IsNotEmpty()
  niveau: NiveauTerritoire;

  @ApiProperty({
    description: 'ID du territoire parent (optionnel)',
    example: 'uuid-region',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    description: 'Contact',
    example: '+225 01 23 45 67 89',
    required: false,
  })
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiProperty({
    description: 'Adresse',
    example: 'Rue des Jardins, Daloa',
    required: false,
  })
  @IsString()
  @IsOptional()
  adresse?: string;
}
