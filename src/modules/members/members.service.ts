import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
      throw new NotFoundException(`Membre "${code}" non trouvé`);
    }
    return membre;
  }

  async findByTelephone(telephone: string) {
    const normalizedPhone = normalizePhoneNumber(telephone);
    const membre = await this.repository.findByTelephone(normalizedPhone);
    if (!membre) {
      throw new NotFoundException('Membre non trouvé');
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
