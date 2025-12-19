import { Controller, Post, Get, HttpCode, HttpStatus, Body, Query, Optional } from '@nestjs/common';
import { WhatsAppClientService } from './whatsapp-client.service';
import { WhatsAppMetaService } from './whatsapp-meta.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Contrôleur pour la gestion de WhatsApp
 * Supporte Baileys et Meta Cloud API
 */
@Controller('whatsapp')
export class WhatsAppController {
  private readonly whatsappMode: string;

  constructor(
    @Optional() private readonly baileysService: WhatsAppClientService,
    @Optional() private readonly metaService: WhatsAppMetaService,
  ) {
    this.whatsappMode = process.env.WHATSAPP_MODE || 'baileys';
  }

  /**
   * Vérifier l'état de la connexion WhatsApp
   * GET /whatsapp/status
   */
  @Get('status')
  getStatus() {
    if (this.whatsappMode === 'meta-cloud' && this.metaService) {
      return {
        mode: 'meta-cloud',
        configured: this.metaService.isConfigured(),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      mode: 'baileys',
      connected: this.baileysService?.isWhatsAppConnected() || false,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Réinitialiser la connexion WhatsApp (Baileys seulement)
   * Supprime les credentials et force une nouvelle authentification
   * POST /whatsapp/reset
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetConnection() {
    if (this.whatsappMode === 'meta-cloud') {
      return {
        success: false,
        message: 'Le reset n\'est pas nécessaire avec Meta Cloud API',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      await this.baileysService?.resetAuthentication();
      return {
        success: true,
        message: 'Connexion WhatsApp réinitialisée. Consultez les logs pour scanner le nouveau QR code.',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la réinitialisation',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Endpoint pour récupérer des informations de diagnostic
   * GET /whatsapp/debug
   */
  @Get('debug')
  async getDebugInfo() {
    const baseInfo = {
      mode: this.whatsappMode,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };

    if (this.whatsappMode === 'meta-cloud' && this.metaService) {
      try {
        const accountInfo = await this.metaService.getAccountInfo();
        return {
          ...baseInfo,
          configured: this.metaService.isConfigured(),
          accountInfo,
        };
      } catch (error) {
        return {
          ...baseInfo,
          configured: this.metaService.isConfigured(),
          error: error.message,
        };
      }
    }

    return {
      ...baseInfo,
      connected: this.baileysService?.isWhatsAppConnected() || false,
      info: 'Consultez les logs Railway pour voir le QR code',
    };
  }

  /**
   * Inspecter le contenu du dossier auth_info_baileys (Baileys seulement)
   * GET /whatsapp/inspect-auth
   */
  @Get('inspect-auth')
  inspectAuthFolder() {
    if (this.whatsappMode === 'meta-cloud') {
      return {
        mode: 'meta-cloud',
        message: 'Cette fonction est uniquement disponible avec Baileys',
        timestamp: new Date().toISOString(),
      };
    }

    const authDir = path.join(process.cwd(), 'auth_info_baileys');

    try {
      // Vérifier si le dossier existe
      if (!fs.existsSync(authDir)) {
        return {
          exists: false,
          path: authDir,
          message: 'Le dossier auth_info_baileys n\'existe pas',
          timestamp: new Date().toISOString(),
        };
      }

      // Lire le contenu du dossier
      const files = fs.readdirSync(authDir);
      const fileDetails = files.map(file => {
        const filePath = path.join(authDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          isFile: stats.isFile(),
          modified: stats.mtime,
        };
      });

      return {
        exists: true,
        path: authDir,
        fileCount: files.length,
        files: fileDetails,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: true,
        message: error.message,
        path: authDir,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Webhook pour recevoir les messages de Meta Cloud API
   * GET /whatsapp/webhook (vérification)
   * POST /whatsapp/webhook (réception des messages)
   */
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && verifyToken === VERIFY_TOKEN) {
      console.log('✅ Webhook vérifié avec succès');
      return challenge;
    }

    console.log('❌ Échec de la vérification du webhook');
    return HttpStatus.FORBIDDEN;
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: any) {
    if (this.whatsappMode !== 'meta-cloud' || !this.metaService) {
      return { success: false, message: 'Meta Cloud API non configuré' };
    }

    try {
      await this.metaService.handleWebhook(body);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur webhook:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer un message manuellement (pour tests)
   * POST /whatsapp/send
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() body: { to: string; message: string }) {
    if (this.whatsappMode !== 'meta-cloud' || !this.metaService) {
      return {
        success: false,
        message: 'Disponible uniquement avec Meta Cloud API',
      };
    }

    try {
      await this.metaService.sendMessage(body.to, body.message);
      return {
        success: true,
        message: 'Message envoyé avec succès',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de l\'envoi',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}