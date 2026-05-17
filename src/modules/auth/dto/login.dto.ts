import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: "Nom d'utilisateur",
    example: 'jean.dupont',
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom d'utilisateur est obligatoire" })
  username: string;

  @ApiProperty({
    description: 'Mot de passe',
    example: 'MonMotDePasse123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @MinLength(6, { message: 'Le mot de passe doit faire au moins 6 caractères' })
  password: string;
}
