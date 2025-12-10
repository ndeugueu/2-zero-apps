/**
 * Script de génération automatique des modules manquants
 * Usage: node generate-modules.js
 */

const fs = require('fs');
const path = require('path');

// Utilitaire pour créer un dossier récursivement
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Utilitaire pour écrire un fichier
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Créé: ${filePath}`);
}

const baseDir = __dirname;

// ============================================
// MODULE MEMBERS (suite)
// ============================================

const membersFiles = {
  'src/modules/members/members.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.MembreCreateInput) {
    return this.prisma.membre.create({ data });
  }

  async findAll() {
    return this.prisma.membre.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.membre.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

  async findByCodeMembre(codeMembre: string) {
    return this.prisma.membre.findUnique({
      where: { codeMembre },
    });
  }

  async findByTelephone(telephone: string) {
    return this.prisma.membre.findUnique({
      where: { telephone },
    });
  }

  async update(id: string, data: Prisma.MembreUpdateInput) {
    return this.prisma.membre.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.membre.delete({
      where: { id },
    });
  }
}
`,

  'src/modules/members/members.service.ts': `import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MembersRepository } from './members.repository';
import { CreateMemberDto, UpdateMemberDto } from './dto/create-member.dto';
import { normalizeCodeMembre, normalizePhoneNumber } from '@shared/utils';

@Injectable()
export class MembersService {
  constructor(private readonly repository: MembersRepository) {}

  async create(dto: CreateMemberDto) {
    const codeMembre = normalizeCodeMembre(dto.nom, dto.prenom);
    const telephone = normalizePhoneNumber(dto.telephone);

    // Vérifier unicité code_membre
    const existing = await this.repository.findByCodeMembre(codeMembre);
    if (existing) {
      throw new ConflictException('Un membre avec ce nom/prénom existe déjà');
    }

    // Vérifier unicité téléphone
    const existingPhone = await this.repository.findByTelephone(telephone);
    if (existingPhone) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    }

    return this.repository.create({
      nom: dto.nom,
      prenom: dto.prenom,
      codeMembre,
      telephone,
      role: dto.role || 'MEMBRE',
      statut: dto.statut || 'ACTIF',
    });
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const membre = await this.repository.findById(id);
    if (!membre) {
      throw new NotFoundException('Membre non trouvé');
    }
    return membre;
  }

  async findByCodeMembre(code: string) {
    const membre = await this.repository.findByCodeMembre(code);
    if (!membre) {
      throw new NotFoundException(\`Membre "\${code}" non trouvé\`);
    }
    return membre;
  }

  async update(id: string, dto: UpdateMemberDto) {
    await this.findById(id); // Vérifier existence

    const updateData: any = {};
    if (dto.nom || dto.prenom) {
      const nom = dto.nom || (await this.findById(id)).nom;
      const prenom = dto.prenom || (await this.findById(id)).prenom;
      updateData.codeMembre = normalizeCodeMembre(nom, prenom);
    }
    if (dto.telephone) {
      updateData.telephone = normalizePhoneNumber(dto.telephone);
    }
    if (dto.role) updateData.role = dto.role;
    if (dto.statut) updateData.statut = dto.statut;

    return this.repository.update(id, updateData);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
`,

  'src/modules/members/members.controller.ts': `import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto } from './dto/create-member.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@shared/decorators';
import { Role } from '@shared/enums';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMemberDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENCAISSEUR, Role.CAPITAINE)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
`,

  'src/modules/members/members.module.ts': `import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MembersRepository } from './members.repository';

@Module({
  controllers: [MembersController],
  providers: [MembersService, MembersRepository],
  exports: [MembersService, MembersRepository],
})
export class MembersModule {}
`,
};

// ============================================
// MODULE COTISATIONS
// ============================================

const cotisationsFiles = {
  'src/modules/cotisations/dto/create-cotisation.dto.ts': `import { IsString, IsNumber, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TypeCotisation, ModePaiement, Source, StatutCotisation } from '@shared/enums';

export class CreateCotisationDto {
  @IsUUID()
  membreId: string;

  @IsNumber()
  montant: number;

  @IsString()
  moisConcerne: string;

  @IsEnum(TypeCotisation)
  typeCotisation: TypeCotisation;

  @IsEnum(ModePaiement)
  modePaiement: ModePaiement;

  @IsEnum(Source)
  source: Source;

  @IsEnum(StatutCotisation)
  @IsOptional()
  statut?: StatutCotisation = StatutCotisation.CONFIRME;

  @IsUUID()
  @IsOptional()
  encaisseurId?: string;

  @IsString()
  @IsOptional()
  motif?: string;
}
`,

  'src/modules/cotisations/cotisations.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CotisationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CotisationCreateInput) {
    return this.prisma.cotisation.create({ data });
  }

  async findByMembre(membreId: string) {
    return this.prisma.cotisation.findMany({
      where: { membreId, statut: 'CONFIRME' },
      orderBy: { dateEnregistrement: 'desc' },
    });
  }

  async findEnAttente() {
    return this.prisma.cotisation.findMany({
      where: { statut: 'EN_ATTENTE_VALIDATION' },
      include: { membre: true },
    });
  }

  async validate(id: string, encaisseurId: string) {
    return this.prisma.cotisation.update({
      where: { id },
      data: {
        statut: 'CONFIRME',
        encaisseurId,
      },
    });
  }
}
`,

  'src/modules/cotisations/cotisations.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { CotisationsRepository } from './cotisations.repository';
import { CreateCotisationDto } from './dto/create-cotisation.dto';
import { validateSourceModePaiement } from '@shared/utils';
import { normalizeMois } from '@shared/utils';

@Injectable()
export class CotisationsService {
  constructor(private readonly repository: CotisationsRepository) {}

  async create(dto: CreateCotisationDto) {
    // Validation règles métier
    if (!validateSourceModePaiement(dto.source, dto.modePaiement)) {
      throw new BadRequestException('Combinaison source/mode_paiement invalide');
    }

    return this.repository.create({
      membre: { connect: { id: dto.membreId } },
      montant: dto.montant,
      moisConcerne: normalizeMois(dto.moisConcerne),
      typeCotisation: dto.typeCotisation,
      modePaiement: dto.modePaiement,
      source: dto.source,
      statut: dto.statut || 'CONFIRME',
      encaisseur: dto.encaisseurId ? { connect: { id: dto.encaisseurId } } : undefined,
      motif: dto.motif,
    });
  }

  async findByMembre(membreId: string) {
    return this.repository.findByMembre(membreId);
  }

  async validate(id: string, encaisseurId: string) {
    return this.repository.validate(id, encaisseurId);
  }
}
`,

  'src/modules/cotisations/cotisations.controller.ts': `import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { CotisationsService } from './cotisations.service';
import { CreateCotisationDto } from './dto/create-cotisation.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles, CurrentUser } from '@shared/decorators';
import { Role } from '@shared/enums';

@Controller('cotisations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CotisationsController {
  constructor(private readonly service: CotisationsService) {}

  @Post()
  @Roles(Role.ENCAISSEUR, Role.ADMIN)
  create(@Body() dto: CreateCotisationDto) {
    return this.service.create(dto);
  }

  @Get('membre/:membreId')
  findByMembre(@Param('membreId') membreId: string) {
    return this.service.findByMembre(membreId);
  }

  @Put(':id/validate')
  @Roles(Role.ENCAISSEUR, Role.ADMIN)
  validate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.validate(id, user.id);
  }
}
`,

  'src/modules/cotisations/cotisations.module.ts': `import { Module } from '@nestjs/common';
import { CotisationsController } from './cotisations.controller';
import { CotisationsService } from './cotisations.service';
import { CotisationsRepository } from './cotisations.repository';

@Module({
  controllers: [CotisationsController],
  providers: [CotisationsService, CotisationsRepository],
  exports: [CotisationsService],
})
export class CotisationsModule {}
`,
};

// ============================================
// AUTRES MODULES (versions simplifiées)
// ============================================

const otherModules = {
  'src/modules/retards/retards.module.ts': `import { Module } from '@nestjs/common';

@Module({})
export class RetardsModule {}
`,

  'src/modules/depenses/depenses.module.ts': `import { Module } from '@nestjs/common';

@Module({})
export class DepensesModule {}
`,

  'src/modules/finance/finance.module.ts': `import { Module } from '@nestjs/common';

@Module({})
export class FinanceModule {}
`,

  'src/modules/whatsapp/whatsapp.module.ts': `import { Module } from '@nestjs/common';

@Module({})
export class WhatsAppModule {}
`,

  'src/modules/commands/commands.module.ts': `import { Module } from '@nestjs/common';

@Module({})
export class CommandsModule {}
`,
};

// ============================================
// MISE À JOUR APP.MODULE.TS
// ============================================

const appModuleContent = `import { Module } from '@nestjs/common';
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
  controllers: [],
  providers: [],
})
export class AppModule {}
`;

// ============================================
// GÉNÉRATION DES FICHIERS
// ============================================

console.log('🚀 Génération des modules manquants...\n');

// Members
Object.entries(membersFiles).forEach(([file, content]) => {
  writeFile(path.join(baseDir, file), content);
});

// Cotisations
Object.entries(cotisationsFiles).forEach(([file, content]) => {
  writeFile(path.join(baseDir, file), content);
});

// Autres modules (stubs)
Object.entries(otherModules).forEach(([file, content]) => {
  writeFile(path.join(baseDir, file), content);
});

// Mise à jour app.module.ts
writeFile(path.join(baseDir, 'src/app.module.ts'), appModuleContent);

console.log(`
✅ Génération terminée !

📦 Modules créés :
  ✅ Members Module (complet avec Repository, Service, Controller)
  ✅ Cotisations Module (complet)
  ⏳ Retards Module (stub - à compléter)
  ⏳ Depenses Module (stub - à compléter)
  ⏳ Finance Module (stub - à compléter)
  ⏳ WhatsApp Module (stub - à compléter)
  ⏳ Commands Module (stub - à compléter)

🔧 App.module.ts mis à jour avec tous les imports

📝 Prochaines étapes :
1. Installer les dépendances manquantes :
   npm install @nestjs/jwt @nestjs/passport passport passport-jwt class-validator class-transformer

2. Générer le client Prisma :
   npx prisma generate

3. Tester l'application :
   npm run start:dev

4. Compléter les modules manquants en suivant le pattern des modules existants

Documentation complète dans : IMPLEMENTATION_GUIDE.md
`);
