import { Module } from '@nestjs/common';
import { CotisationsController } from './cotisations.controller';
import { CotisationsService } from './cotisations.service';
import { CotisationsRepository } from './cotisations.repository';

@Module({
  controllers: [CotisationsController],
  providers: [CotisationsService, CotisationsRepository],
  exports: [CotisationsService],
})
export class CotisationsModule {}
