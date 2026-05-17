import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEmail,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: "Nom d'utilisateur",
    example: 'jean.dupont',
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom d'utilisateur est obligatoire" })
  username: string;

  @ApiProperty({
    description: 'Email',
    example: 'jean.dupont@cmci.ci',
  })
  @IsEmail({}, { message: "L'email n'est pas valide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @ApiProperty({
    description: 'Mot de passe',
    example: 'MonMotDePasse123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @MinLength(6, { message: 'Le mot de passe doit faire au moins 6 caractères' })
  password: string;

  @ApiProperty({
    description: 'Rôle',
    enum: UserRole,
    example: 'DIRIGEANT_ASSEMBLEE',
  })
  @IsEnum(UserRole, { message: "Le rôle n'est pas valide" })
  @IsNotEmpty({ message: 'Le rôle est obligatoire' })
  role: UserRole;

  @ApiProperty({
    description: 'Prénom',
    example: 'Jean',
    required: false,
  })
  @IsString()
  @IsOptional()
  prenom?: string;

  @ApiProperty({
    description: 'Nom',
    example: 'Dupont',
    required: false,
  })
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

  @ApiProperty({
    description: 'ID du territoire',
    example: 'uuid-territoire',
    required: false,
  })
  @IsString()
  @IsOptional()
  territoireId?: string;
}
