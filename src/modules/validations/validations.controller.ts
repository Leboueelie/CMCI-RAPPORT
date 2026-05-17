import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ValidationsService } from './validations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Validations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('validations')
export class ValidationsController {
  constructor(private readonly validationsService: ValidationsService) {}

  @Get('file-attente')
  @Roles(
    UserRole.DIRIGEANT_ZONE,
    UserRole.MISSIONNAIRE,
    UserRole.RESPONSABLE_REGIONAL,
    UserRole.RESPONSABLE_NATIONAL,
    UserRole.ADMIN_SYSTEME, // <-- indispensable pour l'admin
  )
  @ApiOperation({ summary: "File d'attente de validation" })
  getFileAttente(@CurrentUser() user: any) {
    return this.validationsService.getFileAttente(user);
  }

  @Get('stats')
  @Roles(
    UserRole.DIRIGEANT_ZONE,
    UserRole.MISSIONNAIRE,
    UserRole.RESPONSABLE_REGIONAL,
    UserRole.RESPONSABLE_NATIONAL,
    UserRole.ADMIN_SYSTEME,
  )
  @ApiOperation({ summary: 'Statistiques de validation' })
  getStats(@CurrentUser() user: any) {
    return this.validationsService.getStats(user);
  }
}
