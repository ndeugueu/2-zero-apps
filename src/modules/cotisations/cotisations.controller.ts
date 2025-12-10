import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
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
