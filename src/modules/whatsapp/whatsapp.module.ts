import { Module } from '@nestjs/common';
import { WhatsAppClientService } from './whatsapp-client.service';
import { CommandsModule } from '../commands/commands.module';

@Module({
  imports: [CommandsModule],
  providers: [WhatsAppClientService],
  exports: [WhatsAppClientService],
})
export class WhatsAppModule {}
