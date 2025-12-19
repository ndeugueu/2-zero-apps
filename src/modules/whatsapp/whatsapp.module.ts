import { Module } from '@nestjs/common';
import { WhatsAppClientService } from './whatsapp-client.service';
import { WhatsAppMetaService } from './whatsapp-meta.service';
import { WhatsAppController } from './whatsapp.controller';
import { CommandsModule } from '../commands/commands.module';

/**
 * Module WhatsApp - Supporte Baileys et Meta Cloud API
 * Configuré via la variable d'environnement WHATSAPP_MODE
 */
@Module({
  imports: [CommandsModule],
  controllers: [WhatsAppController],
  providers: [
    // Toujours fournir les deux services
    // Le contrôleur choisira lequel utiliser selon WHATSAPP_MODE
    WhatsAppClientService,
    WhatsAppMetaService,
  ],
  exports: [WhatsAppClientService, WhatsAppMetaService],
})
export class WhatsAppModule {}
