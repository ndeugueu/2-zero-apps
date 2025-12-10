import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UnitOfWorkService } from './unit-of-work.service';

/**
 * Module Database - Module global pour Prisma et Unit of Work
 * @Global permet de ne pas avoir à importer ce module partout
 */
@Global()
@Module({
  providers: [PrismaService, UnitOfWorkService],
  exports: [PrismaService, UnitOfWorkService],
})
export class DatabaseModule {}
