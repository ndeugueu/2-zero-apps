import { IsString, IsNumber, IsEnum, IsOptional, IsUUID } from 'class-validator';
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
