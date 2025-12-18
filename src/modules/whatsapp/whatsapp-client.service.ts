import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import * as fs from 'fs';
import * as path from 'path';
import { CommandsService } from '../commands/commands.service';

/**
 * Service de gestion de la connexion WhatsApp via Baileys
 */
@Injectable()
export class WhatsAppClientService implements OnModuleInit {
  private sock: WASocket;
  private readonly logger = new Logger(WhatsAppClientService.name);
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly BASE_RECONNECT_DELAY = 5000; // 5 secondes

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
      browser: ['2-0 3F Bot', 'Chrome', '1.0.0'], // Identifier le client
    });

    // Gestion de la connexion
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Debug: log all update events
      this.logger.debug(`Connection update: ${JSON.stringify({ connection, hasQr: !!qr, hasError: !!lastDisconnect })}`);

      if (qr) {
        this.logger.log('📱 QR Code reçu ! Scannez-le avec WhatsApp:');
        this.logger.log('-------------------------------------------');
        qrcode.generate(qr, { small: true });
        this.logger.log('-------------------------------------------');
        this.logger.log('📲 Ouvrez WhatsApp > Réglages > Appareils connectés > Connecter un appareil');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        this.logger.warn('Connexion fermée', {
          shouldReconnect,
          statusCode,
          reconnectAttempts: this.reconnectAttempts,
          maxAttempts: this.MAX_RECONNECT_ATTEMPTS
        });

        if (shouldReconnect) {
          this.reconnectAttempts++;

          // Limite de tentatives atteinte
          if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            this.logger.error(
              `❌ Échec après ${this.MAX_RECONNECT_ATTEMPTS} tentatives de reconnexion.`
            );
            this.logger.error('💡 Actions recommandées:');
            this.logger.error('   1. Vérifiez que WhatsApp est bien installé sur votre téléphone');
            this.logger.error('   2. Supprimez le dossier ./auth_info_baileys');
            this.logger.error('   3. Redémarrez l\'application pour générer un nouveau QR code');
            this.logger.error('   4. Scannez le QR code dans les 60 secondes');

            // Réinitialiser pour permettre une nouvelle tentative manuelle
            this.reconnectAttempts = 0;
            return;
          }

          // Backoff exponentiel : 5s, 10s, 20s, 40s, etc. (max 60s)
          const delay = Math.min(
            this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
            60000
          );

          this.logger.log(`⏳ Reconnexion dans ${delay / 1000}s (tentative ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);

          setTimeout(() => this.connectToWhatsApp(), delay);
        } else {
          this.logger.error('❌ Déconnecté (logged out). Supprimez ./auth_info_baileys et redémarrez.');
          this.reconnectAttempts = 0;
        }
      } else if (connection === 'open') {
        this.isConnected = true;
        this.reconnectAttempts = 0; // Réinitialiser le compteur en cas de succès
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

    const senderNumber = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
    const remoteJid = message.key.remoteJid || '';

    if (!senderNumber || !remoteJid) {
      this.logger.warn('Message sans expéditeur valide');
      return;
    }

    this.logger.log(`Message reçu de ${senderNumber}: ${messageText}`);

    try {
      // Traiter la commande via le CommandsService
      const response = await this.commandsService.processCommand(
        messageText,
        senderNumber,
      );

      // Envoyer la réponse
      await this.sendMessage(remoteJid, response);
    } catch (error) {
      this.logger.error('Erreur lors du traitement du message:', error);
      await this.sendMessage(
        remoteJid,
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

  /**
   * Supprimer les credentials et forcer une nouvelle authentification
   * Utile quand les credentials sont corrompus
   */
  async resetAuthentication(): Promise<void> {
    const authDir = path.join(process.cwd(), 'auth_info_baileys');

    try {
      if (fs.existsSync(authDir)) {
        this.logger.warn('🗑️  Suppression des credentials corrompus...');
        fs.rmSync(authDir, { recursive: true, force: true });
        this.logger.log('✅ Credentials supprimés avec succès');
      }

      // Réinitialiser le compteur
      this.reconnectAttempts = 0;
      this.isConnected = false;

      // Déconnecter l'ancien socket si existant
      if (this.sock) {
        try {
          this.sock.end(undefined);
        } catch (error) {
          // Ignorer les erreurs de déconnexion
        }
      }

      // Reconnecter avec de nouveaux credentials
      this.logger.log('🔄 Reconnexion avec de nouveaux credentials...');
      await this.connectToWhatsApp();
    } catch (error) {
      this.logger.error('❌ Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }
}
