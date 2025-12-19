import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { CommandsService } from '../commands/commands.service';

/**
 * Service de gestion de WhatsApp via Meta Cloud API (officiel)
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api/
 */
@Injectable()
export class WhatsAppMetaService {
  private readonly logger = new Logger(WhatsAppMetaService.name);
  private readonly apiUrl = 'https://graph.facebook.com/v18.0';
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(private readonly commandsService: CommandsService) {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';

    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.warn(
        '⚠️  WHATSAPP_PHONE_NUMBER_ID ou WHATSAPP_ACCESS_TOKEN non configuré. Meta Cloud API ne fonctionnera pas.',
      );
    } else {
      this.logger.log('✅ Meta Cloud API configuré avec succès');
      this.logger.log(`📱 Phone Number ID: ${this.phoneNumberId}`);
    }
  }

  /**
   * Envoyer un message texte
   */
  async sendMessage(to: string, text: string): Promise<void> {
    try {
      // Formater le numéro (retirer le + si présent)
      const formattedTo = to.replace(/\+/g, '');

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedTo,
        type: 'text',
        text: {
          body: text,
        },
      };

      this.logger.log(`📤 Envoi message à ${formattedTo}: "${text.substring(0, 50)}..."`);

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`✅ Message envoyé avec succès. ID: ${response.data.messages[0].id}`);
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'envoi du message:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Marquer un message comme lu
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.debug(`✅ Message ${messageId} marqué comme lu`);
    } catch (error) {
      this.logger.error(`❌ Erreur lors du marquage comme lu:`, error.response?.data || error.message);
    }
  }

  /**
   * Traiter un webhook entrant de Meta
   */
  async handleWebhook(body: any): Promise<void> {
    try {
      this.logger.debug(`📥 Webhook reçu:`, JSON.stringify(body, null, 2));

      // Vérifier que c'est un webhook WhatsApp
      if (body.object !== 'whatsapp_business_account') {
        this.logger.warn('⚠️  Webhook ignoré (pas WhatsApp Business Account)');
        return;
      }

      // Parcourir les entrées
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') {
            continue;
          }

          const value = change.value;

          // Traiter les messages reçus
          if (value.messages) {
            for (const message of value.messages) {
              await this.handleIncomingMessage(message, value.metadata);
            }
          }

          // Traiter les statuts (optionnel)
          if (value.statuses) {
            for (const status of value.statuses) {
              this.handleMessageStatus(status);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors du traitement du webhook:', error);
      throw error;
    }
  }

  /**
   * Traiter un message entrant
   */
  private async handleIncomingMessage(message: any, metadata: any): Promise<void> {
    try {
      // Ignorer les messages de statut (delivered, read, etc.)
      if (message.type !== 'text') {
        this.logger.debug(`Message de type ${message.type} ignoré`);
        return;
      }

      const from = message.from; // Numéro de l'expéditeur
      const messageId = message.id;
      const text = message.text?.body;

      if (!text) {
        this.logger.warn('Message sans texte reçu');
        return;
      }

      this.logger.log(`📩 Message reçu de ${from}: "${text}"`);

      // Marquer comme lu
      await this.markAsRead(messageId);

      // Traiter la commande
      const response = await this.commandsService.processCommand(text, from);

      // Envoyer la réponse
      await this.sendMessage(from, response);
    } catch (error) {
      this.logger.error('❌ Erreur lors du traitement du message:', error);

      // Envoyer un message d'erreur à l'utilisateur
      try {
        await this.sendMessage(
          message.from,
          '❌ Erreur lors du traitement de votre demande. Tapez AIDE pour voir les commandes disponibles.',
        );
      } catch (sendError) {
        this.logger.error('❌ Impossible d\'envoyer le message d\'erreur:', sendError);
      }
    }
  }

  /**
   * Traiter les statuts de messages (optionnel, pour logging)
   */
  private handleMessageStatus(status: any): void {
    const statusType = status.status; // sent, delivered, read, failed
    const messageId = status.id;

    this.logger.debug(`📊 Statut message ${messageId}: ${statusType}`);

    if (statusType === 'failed') {
      this.logger.error(`❌ Échec d'envoi du message ${messageId}:`, status.errors);
    }
  }

  /**
   * Vérifier que la configuration est valide
   */
  isConfigured(): boolean {
    return !!(this.phoneNumberId && this.accessToken);
  }

  /**
   * Obtenir des informations sur le compte
   */
  async getAccountInfo(): Promise<any> {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          fields: 'verified_name,code_verification_status,display_phone_number,quality_rating',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération des infos:', error.response?.data || error.message);
      throw error;
    }
  }
}