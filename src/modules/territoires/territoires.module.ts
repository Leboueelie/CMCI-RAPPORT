import { Module } from '@nestjs/common';
import { TerritoiresController } from './territoires.controller';
import { TerritoiresService } from './territoires.service';

@Module({
  controllers: [TerritoiresController],
  providers: [TerritoiresService],
  exports: [TerritoiresService],
})
export class TerritoiresModule {}
