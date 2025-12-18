import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { WhatsAppClientService } from './whatsapp-client.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Contrôleur pour la gestion de WhatsApp
 */
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppClientService) {}

  /**
   * Vérifier l'état de la connexion WhatsApp
   * GET /whatsapp/status
   */
  @Get('status')
  getStatus() {
    return {
      connected: this.whatsappService.isWhatsAppConnected(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Réinitialiser la connexion WhatsApp
   * Supprime les credentials et force une nouvelle authentification
   * POST /whatsapp/reset
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetConnection() {
    try {
      await this.whatsappService.resetAuthentication();
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
  getDebugInfo() {
    return {
      connected: this.whatsappService.isWhatsAppConnected(),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      info: 'Consultez les logs Railway pour voir le QR code',
    };
  }

  /**
   * Inspecter le contenu du dossier auth_info_baileys
   * GET /whatsapp/inspect-auth
   */
  @Get('inspect-auth')
  inspectAuthFolder() {
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
}
