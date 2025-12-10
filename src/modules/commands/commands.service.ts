import { Injectable, Logger } from '@nestjs/common';
import { MembersService } from '../members/members.service';
import { CotisationsService } from '../cotisations/cotisations.service';
import { TypeCotisation, ModePaiement, Source } from '@shared/enums';

/**
 * Service de traitement des commandes WhatsApp
 */
@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);

  constructor(
    private readonly membersService: MembersService,
    private readonly cotisationsService: CotisationsService,
  ) {}

  /**
   * Traiter une commande reçue par WhatsApp
   */
  async processCommand(text: string, senderNumber: string): Promise<string> {
    const command = text.trim().toUpperCase();

    this.logger.log(`Commande reçue: ${command} de ${senderNumber}`);

    // Normaliser le numéro (ajouter +237 si nécessaire)
    const phoneNumber = senderNumber.startsWith('+')
      ? senderNumber
      : `+${senderNumber}`;

    // Vérifier que le membre existe
    let membre;
    try {
      membre = await this.membersService.findByTelephone(phoneNumber);
    } catch (error) {
      return `❌ Numéro non enregistré: ${phoneNumber}\n\nContactez un administrateur pour créer votre compte.`;
    }

    // Commandes disponibles
    if (command === 'AIDE' || command === 'HELP' || command === '?') {
      return this.getHelpMessage(membre.role);
    }

    if (command === 'SOLDE') {
      return this.getSolde(membre.id);
    }

    if (command.startsWith('ENC:')) {
      return this.handleEncaissement(command, membre);
    }

    if (command === 'MEMBRES' || command === 'LISTE') {
      return this.getMembresList();
    }

    // Commande non reconnue
    return `❌ Commande non reconnue: ${command}\n\nTapez AIDE pour voir les commandes disponibles.`;
  }

  /**
   * Message d'aide selon le rôle
   */
  private getHelpMessage(role: string): string {
    let message = `📱 *BOT WHATSAPP 2-0 3F*\n\n`;
    message += `📋 *Commandes disponibles:*\n\n`;
    message += `SOLDE - Consulter votre solde\n`;
    message += `AIDE - Afficher ce message\n\n`;

    if (role === 'ENCAISSEUR' || role === 'ADMIN') {
      message += `*Commandes Encaisseur:*\n`;
      message += `ENC: NOM PRENOM MONTANT MOIS\n`;
      message += `  Exemple: ENC: MBAPPE KEVIN 10 DECEMBRE\n\n`;
      message += `MEMBRES - Liste des membres\n\n`;
    }

    if (role === 'ADMIN') {
      message += `*Commandes Admin:*\n`;
      message += `(En cours d'implémentation)\n\n`;
    }

    message += `💡 Pour plus d'infos: contactez un admin`;

    return message;
  }

  /**
   * Obtenir le solde d'un membre
   */
  private async getSolde(membreId: string): Promise<string> {
    try {
      const cotisations = await this.cotisationsService.findByMembre(membreId);

      const totalVerse = cotisations.reduce(
        (sum, cot) => sum + parseFloat(cot.montant.toString()),
        0,
      );

      // Calculer le nombre de mois depuis le début (à adapter selon votre logique)
      const moisActuel = new Date().getMonth() + 1;
      const montantAttendu = moisActuel * 10; // 10€ par mois

      const solde = totalVerse - montantAttendu;

      let message = `💰 *VOTRE SOLDE*\n\n`;
      message += `Versé: ${totalVerse}€\n`;
      message += `Attendu: ${montantAttendu}€\n`;
      message += `Solde: ${solde >= 0 ? '+' : ''}${solde}€\n\n`;

      if (solde < 0) {
        message += `⚠️ Vous avez un retard de ${Math.abs(solde)}€`;
      } else {
        message += `✅ Votre compte est à jour!`;
      }

      return message;
    } catch (error) {
      this.logger.error('Erreur lors du calcul du solde:', error);
      return '❌ Erreur lors du calcul de votre solde';
    }
  }

  /**
   * Gérer l'encaissement
   * Format: ENC: NOM PRENOM MONTANT MOIS
   */
  private async handleEncaissement(
    command: string,
    encaisseur: any,
  ): Promise<string> {
    if (encaisseur.role !== 'ENCAISSEUR' && encaisseur.role !== 'ADMIN') {
      return '❌ Vous n\'avez pas les droits pour encaisser';
    }

    try {
      // Parser la commande
      const parts = command.replace('ENC:', '').trim().split(' ');

      if (parts.length < 4) {
        return '❌ Format invalide. Utilisez: ENC: NOM PRENOM MONTANT MOIS';
      }

      const nom = parts[0];
      const prenom = parts[1];
      const montant = parseFloat(parts[2]);
      const mois = parts[3];

      // Trouver le membre
      const codeMembre = `${nom} ${prenom}`.toUpperCase();
      const membre = await this.membersService.findByCodeMembre(codeMembre);

      // Créer la cotisation
      await this.cotisationsService.create({
        membreId: membre.id,
        montant,
        moisConcerne: mois.toUpperCase(),
        typeCotisation: TypeCotisation.MENSUELLE,
        modePaiement: ModePaiement.CASH,
        source: Source.ENCAISSEUR,
        encaisseurId: encaisseur.id,
      });

      return `✅ *ENCAISSEMENT ENREGISTRÉ*\n\nMembre: ${codeMembre}\nMontant: ${montant}€\nMois: ${mois}\n\nEncaissé par: ${encaisseur.codeMembre}`;
    } catch (error) {
      this.logger.error('Erreur lors de l\'encaissement:', error);
      return `❌ Erreur: ${error.message}`;
    }
  }

  /**
   * Liste des membres
   */
  private async getMembresList(): Promise<string> {
    try {
      const membres = await this.membersService.findAll();

      let message = `👥 *LISTE DES MEMBRES*\n\n`;
      message += `Total: ${membres.length} membres\n\n`;

      for (const membre of membres) {
        const emoji =
          membre.role === 'ADMIN' ? '👑' : membre.role === 'ENCAISSEUR' ? '💼' : '👤';
        message += `${emoji} ${membre.codeMembre} (${membre.role})\n`;
      }

      return message;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des membres:', error);
      return '❌ Erreur lors de la récupération de la liste';
    }
  }
}
