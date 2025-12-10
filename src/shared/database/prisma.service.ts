import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Service Prisma - Gestion connexion PostgreSQL
 * Singleton qui gère le lifecycle de la connexion DB
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  /**
   * Connexion à la DB au démarrage du module
   */
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Connected to PostgreSQL database');
  }

  /**
   * Déconnexion propre lors de l'arrêt de l'application
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Disconnected from PostgreSQL database');
  }

  /**
   * Helper pour nettoyer la DB (tests uniquement)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    // Ordre important pour respecter les contraintes FK
    await this.$transaction([
      this.permissionSpeciale.deleteMany(),
      this.depense.deleteMany(),
      this.retard.deleteMany(),
      this.cotisation.deleteMany(),
      this.associationCompte.deleteMany(),
      this.membre.deleteMany(),
    ]);
  }
}
