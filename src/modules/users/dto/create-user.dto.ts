import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: "Nom d'utilisateur", example: 'jean.dupont' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Email', example: 'jean@cmci.ci' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Mot de passe', example: 'MotDePasse123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Rôle',
    enum: UserRole,
    example: 'DIRIGEANT_ASSEMBLEE',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({ description: 'Prénom', example: 'Jean', required: false })
  @IsString()
  @IsOptional()
  prenom?: string;

  @ApiProperty({ description: 'Nom', example: 'Dupont', required: false })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiProperty({
    description: 'Contact',
    example: '+225 01 23 45 67 89',
    required: false,
  })
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiProperty({ description: 'ID du territoire', required: false })
  @IsString()
  @IsOptional()
  territoireId?: string;
}
