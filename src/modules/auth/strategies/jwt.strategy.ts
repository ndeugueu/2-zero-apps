import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@shared/database/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Stratégie JWT pour Passport
 * Valide le token et charge le membre depuis la DB
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Vérifier que le membre existe toujours
    const membre = await this.prisma.membre.findUnique({
      where: { id: payload.sub },
      include: {
        permissions: true,
      },
    });

    if (!membre || membre.statut !== 'ACTIF') {
      throw new UnauthorizedException('Membre non trouvé ou inactif');
    }

    // Retourner les infos du membre (disponible via @CurrentUser())
    return {
      id: membre.id,
      telephone: membre.telephone,
      role: membre.role,
      codeMembre: membre.codeMembre,
      nom: membre.nom,
      prenom: membre.prenom,
      permissions: membre.permissions.map((p) => p.permission),
    };
  }
}
