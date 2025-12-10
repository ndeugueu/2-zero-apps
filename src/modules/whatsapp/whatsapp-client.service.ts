import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as QRCode from 'qrcode-terminal';
import { CommandsService } from '../commands/commands.service';

/**
 * Service de gestion de la connexion WhatsApp via Baileys
 */
@Injectable()
export class WhatsAppClientService implements OnModuleInit {
  private sock: WASocket;
  private readonly logger = new Logger(WhatsAppClientService.name);
  private isConnected = false;

  constructor(private readonly commandsService: CommandsService) {}

  async onModuleInit() {
    await this.connectToWhatsApp();
  }

  /**
   * Connexion à WhatsApp avec Baileys
   */
  async connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Affiche le QR code dans le terminal
      logger: {
        level: 'info',
        fatal: (msg) => this.logger.error(msg),
        error: (msg) => this.logger.error(msg),
        warn: (msg) => this.logger.warn(msg),
        info: (msg) => this.logger.log(msg),
        debug: (msg) => this.logger.debug(msg),
        trace: (msg) => this.logger.verbose(msg),
      },
    });

    // Gestion de la connexion
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.logger.log('QR Code reçu, scannez-le avec WhatsApp');
        QRCode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        this.logger.warn('Connexion fermée, reconnexion...', { shouldReconnect });

        if (shouldReconnect) {
          await this.connectToWhatsApp();
        }
      } else if (connection === 'open') {
        this.isConnected = true;
        this.logger.log('✅ Connecté à WhatsApp avec succès!');
      }
    });

    // Sauvegarder les credentials
    this.sock.ev.on('creds.update', saveCreds);

    // Écouter les messages entrants
    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const message of messages) {
          await this.handleIncomingMessage(message);
        }
      }
    });
  }

  /**
   * Traiter les messages entrants
   */
  private async handleIncomingMessage(message: proto.IWebMessageInfo) {
    // Ignorer les messages envoyés par nous
    if (message.key.fromMe) return;

    const messageText =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;

    if (!messageText) return;

    const senderNumber = message.key.remoteJid?.replace('@s.whatsapp.net', '');

    this.logger.log(`Message reçu de ${senderNumber}: ${messageText}`);

    try {
      // Traiter la commande via le CommandsService
      const response = await this.commandsService.processCommand(
        messageText,
        senderNumber,
      );

      // Envoyer la réponse
      await this.sendMessage(message.key.remoteJid, response);
    } catch (error) {
      this.logger.error('Erreur lors du traitement du message:', error);
      await this.sendMessage(
        message.key.remoteJid,
        '❌ Erreur lors du traitement de votre demande. Tapez AIDE pour voir les commandes disponibles.',
      );
    }
  }

  /**
   * Envoyer un message WhatsApp
   */
  async sendMessage(to: string, text: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('WhatsApp non connecté');
    }

    try {
      await this.sock.sendMessage(to, { text });
      this.logger.log(`Message envoyé à ${to}`);
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }

  /**
   * Vérifier l'état de la connexion
   */
  isWhatsAppConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Déconnexion
   */
  async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.isConnected = false;
      this.logger.log('Déconnecté de WhatsApp');
    }
  }
}
