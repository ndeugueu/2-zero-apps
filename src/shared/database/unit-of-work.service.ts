import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma, PrismaClient } from '@prisma/client';

// Type pour le client de transaction Prisma
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Unit of Work Service - Gestion des transactions atomiques
 * Pattern critique pour les opérations financières
 *
 * Exemple d'utilisation:
 * ```typescript
 * await this.unitOfWork.execute(async (tx) => {
 *   // Toutes les opérations dans cette fonction sont dans une transaction
 *   await tx.cotisation.create({...});
 *   await tx.retard.update({...});
 *   // Si une opération échoue, tout est rollback automatiquement
 * });
 * ```
 */
@Injectable()
export class UnitOfWorkService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Exécute des opérations dans une transaction atomique
   * @param fn - Fonction contenant les opérations à exécuter
   * @returns Résultat de la fonction
   */
  async execute<T>(
    fn: (tx: TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn, {
      maxWait: 5000, // Temps max d'attente pour obtenir le lock (5s)
      timeout: 10000, // Timeout de la transaction (10s)
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    });
  }

  /**
   * Exécute une transaction avec isolation SERIALIZABLE
   * Utilisé pour les opérations critiques (éviter race conditions)
   */
  async executeSerializable<T>(
    fn: (tx: TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }
}
