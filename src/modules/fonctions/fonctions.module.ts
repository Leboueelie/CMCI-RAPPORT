import { Module } from '@nestjs/common';
import { FonctionsController } from './fonctions.controller';

@Module({
  controllers: [FonctionsController],
})
export class FonctionsModule {}
