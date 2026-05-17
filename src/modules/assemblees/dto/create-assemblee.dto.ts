// src/modules/assemblees/dto/create-assemblee.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssembleeDto {
  @ApiProperty({
    description: "Nom de l'assemblée",
    example: 'Assemblée Daloa Centre',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'ID du territoire (niveau SECTEUR)',
    example: 'uuid-territoire',
  })
  @IsString()
  @IsNotEmpty()
  territoireId: string;

  @ApiProperty({
    description: 'IDs des dirigeants (peut être vide)',
    example: ['uuid-user1', 'uuid-user2'],
    required: false,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dirigeantIds?: string[];

  @ApiProperty({ description: 'Contact', required: false })
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiProperty({ description: 'Adresse', required: false })
  @IsString()
  @IsOptional()
  adresse?: string;
}
