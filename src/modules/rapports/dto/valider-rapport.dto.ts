import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValiderRapportDto {
  @ApiProperty({ description: 'Action', enum: ['valider', 'rejeter'] })
  @IsString()
  @IsNotEmpty()
  action: 'valider' | 'rejeter';

  @ApiProperty({
    description: 'Commentaire (obligatoire si rejet)',
    example: 'Données incomplètes',
    required: false,
  })
  @IsString()
  @IsOptional()
  commentaire?: string;
}
