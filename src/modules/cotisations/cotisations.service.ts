import { Injectable, BadRequestException } from '@nestjs/common';
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
