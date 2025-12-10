import { Injectable } from '@nestjs/common';
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
