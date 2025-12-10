import { Injectable } from '@nestjs/common';
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
