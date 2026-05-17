import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { FilterDashboardDto } from './dto/filter-dashboard.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Résumé du dashboard (stats globales)' })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiQuery({ name: 'territoireId', required: false })
  @ApiResponse({ status: 200, description: 'Stats récupérées avec succès' })
  async getSummary(
    @Query() filters: FilterDashboardDto,
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getSummary(user, filters);
  }

  @Get('territoire/:id')
  @ApiOperation({ summary: 'Stats par territoire spécifique' })
  @ApiResponse({ status: 200, description: 'Stats du territoire' })
  @ApiResponse({ status: 403, description: 'Territoire hors périmètre' })
  async getStatsByTerritoire(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getStatsByTerritoire(id, user);
  }
}
