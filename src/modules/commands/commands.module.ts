import { Module } from '@nestjs/common';
import { CommandsService } from './commands.service';
import { MembersModule } from '../members/members.module';
import { CotisationsModule } from '../cotisations/cotisations.module';

@Module({
  imports: [MembersModule, CotisationsModule],
  providers: [CommandsService],
  exports: [CommandsService],
})
export class CommandsModule {}
