import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './shared/database/prisma.service';

/**
 * Contrôleur racine de l'application
 * Fournit des endpoints de santé et d'information
 */
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET / - Informations de base sur l'API
   */
  @Get()
  getRoot() {
    return {
      status: 'ok',
      name: 'Bot WhatsApp 2-0 3F API',
      version: '1.0.0',
      description: 'API de gestion des cotisations pour l\'association Deux Zéros 3F',
      documentation: '/api/docs',
      endpoints: {
        auth: '/auth',
        members: '/members',
        cotisations: '/cotisations',
        health: '/health',
      },
    };
  }

  /**
   * GET /health - Health check avec vérification DB
   */
  @Get('health')
  async getHealth() {
    let databaseStatus = 'disconnected';
    let databaseLatency = null;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      databaseLatency = Date.now() - start;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'error';
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: databaseStatus,
          latency: databaseLatency ? `${databaseLatency}ms` : null,
        },
        redis: {
          status: 'not_implemented',
          note: 'Redis health check à implémenter',
        },
      },
      version: '1.0.0',
    };
  }
}
