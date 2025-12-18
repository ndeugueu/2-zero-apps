import { Module } from '@nestjs/common';
import { WhatsAppClientService } from './whatsapp-client.service';
import { WhatsAppController } from './whatsapp.controller';
import { CommandsModule } from '../commands/commands.module';

@Module({
  imports: [CommandsModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppClientService],
  exports: [WhatsAppClientService],
})
export class WhatsAppModule {}
