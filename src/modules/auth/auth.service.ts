import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@shared/database/prisma.service';
import { normalizePhoneNumber } from '@shared/utils';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto, LoginResponseDto } from './dto/login.dto';

/**
 * Service d'authentification
 * Gère login via numéro WhatsApp et génération de tokens JWT
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Login par numéro de téléphone WhatsApp
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const telephone = normalizePhoneNumber(loginDto.telephone);

    // Trouver le membre par téléphone
    const membre = await this.prisma.membre.findUnique({
      where: { telephone },
    });

    if (!membre) {
      throw new UnauthorizedException('Membre non trouvé');
    }

    if (membre.statut !== 'ACTIF') {
      throw new UnauthorizedException('Membre inactif');
    }

    // Générer les tokens
    const payload: JwtPayload = {
      sub: membre.id,
      telephone: membre.telephone,
      role: membre.role as any,
      codeMembre: membre.codeMembre,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      membre: {
        id: membre.id,
        nom: membre.nom,
        prenom: membre.prenom,
        codeMembre: membre.codeMembre,
        role: membre.role,
      },
    };
  }

  /**
   * Refresh access token avec refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const newPayload: JwtPayload = {
        sub: payload.sub,
        telephone: payload.telephone,
        role: payload.role,
        codeMembre: payload.codeMembre,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token invalide');
    }
  }

  /**
   * Valider un membre par son ID
   */
  async validateMembre(membreId: string) {
    const membre = await this.prisma.membre.findUnique({
      where: { id: membreId },
      include: {
        permissions: true,
      },
    });

    if (!membre || membre.statut !== 'ACTIF') {
      return null;
    }

    return membre;
  }
}
