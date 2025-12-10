import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { Role, StatutMembre } from '@shared/enums';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  prenom: string;

  @IsString()
  @IsNotEmpty()
  telephone: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.MEMBRE;

  @IsEnum(StatutMembre)
  @IsOptional()
  statut?: StatutMembre = StatutMembre.ACTIF;
}

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  prenom?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(StatutMembre)
  @IsOptional()
  statut?: StatutMembre;
}
