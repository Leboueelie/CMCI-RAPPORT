import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Ancien mot de passe',
    example: 'AncienPass123!',
  })
  @IsString()
  @IsNotEmpty({ message: "L'ancien mot de passe est obligatoire" })
  oldPassword: string;

  @ApiProperty({
    description: 'Nouveau mot de passe',
    example: 'NouveauPass456!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nouveau mot de passe est obligatoire' })
  @MinLength(6, {
    message: 'Le nouveau mot de passe doit faire au moins 6 caractères',
  })
  newPassword: string;
}
