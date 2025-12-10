import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './shared/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { CotisationsModule } from './modules/cotisations/cotisations.module';
import { RetardsModule } from './modules/retards/retards.module';
import { DepensesModule } from './modules/depenses/depenses.module';
import { FinanceModule } from './modules/finance/finance.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { CommandsModule } from './modules/commands/commands.module';
import { AppController } from './app.controller';

/**
 * Module racine de l'application
 * Architecture: Monolithe Modulaire avec modules découplés
 */
@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database (Prisma + PostgreSQL)
    DatabaseModule,

    // Modules métier
    AuthModule,
    MembersModule,
    CotisationsModule,
    RetardsModule,
    DepensesModule,
    FinanceModule,
    WhatsAppModule,
    CommandsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
