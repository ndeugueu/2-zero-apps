import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non définies dans les DTOs
      forbidNonWhitelisted: true, // Rejette les requêtes avec propriétés inconnues
      transform: true, // Transforme automatiquement les types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS (si frontend séparé)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const whatsappMode = process.env.WHATSAPP_MODE || 'baileys';
  const whatsappDisplay = whatsappMode === 'meta-cloud' ? 'Meta Cloud API' : 'Baileys';

  console.log(`
  🚀 Application démarrée avec succès!
  📍 URL: http://localhost:${port}
  🔧 Environnement: ${process.env.NODE_ENV || 'development'}
  💾 Database: PostgreSQL
  📱 WhatsApp: ${whatsappDisplay}
  `);
}

bootstrap();
