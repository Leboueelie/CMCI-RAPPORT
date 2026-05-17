import { Module } from '@nestjs/common';
import { AssembleesController } from './assemblees.controller';
import { AssembleesService } from './assemblees.service';

@Module({
  controllers: [AssembleesController],
  providers: [AssembleesService],
  exports: [AssembleesService],
})
export class AssembleesModule {}
