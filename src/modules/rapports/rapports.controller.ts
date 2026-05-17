import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RapportsService } from './rapports.service';
import { CreateRapportDto } from './dto/create-rapport.dto';
import { UpdateRapportDto } from './dto/update-rapport.dto';
import { FilterRapportDto } from './dto/filter-rapport.dto';
import { ValiderRapportDto } from './dto/valider-rapport.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Rapports')
@Controller('rapports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RapportsController {
  constructor(private rapportsService: RapportsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des rapports (paginée, filtrable)' })
  @ApiQuery({ name: 'statut', required: false })
  @ApiQuery({ name: 'assembleeId', required: false })
  @ApiQuery({ name: 'periode', required: false })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Liste récupérée avec succès' })
  async findAll(@Query() filters: FilterRapportDto, @CurrentUser() user: any) {
    return this.rapportsService.findAll(filters, user);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un rapport" })
  @ApiResponse({ status: 200, description: 'Rapport trouvé' })
  @ApiResponse({ status: 404, description: 'Rapport non trouvé' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rapportsService.findOne(id, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un rapport (Brouillon)' })
  @ApiResponse({ status: 201, description: 'Rapport créé' })
  @ApiResponse({
    status: 409,
    description: 'Rapport déjà existant pour cette période',
  })
  async create(@Body() createDto: CreateRapportDto, @CurrentUser() user: any) {
    return this.rapportsService.create(createDto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un rapport (uniquement en Brouillon)' })
  @ApiResponse({ status: 200, description: 'Rapport modifié' })
  @ApiResponse({
    status: 400,
    description: 'Rapport non modifiable (pas en Brouillon)',
  })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRapportDto,
    @CurrentUser() user: any,
  ) {
    return this.rapportsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un rapport (uniquement en Brouillon)' })
  @ApiResponse({ status: 200, description: 'Rapport supprimé' })
  @ApiResponse({ status: 400, description: 'Rapport non supprimable' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rapportsService.remove(id, user);
  }

  @Post(':id/soumettre')
  @ApiOperation({ summary: 'Soumettre un rapport (Brouillon → Soumis)' })
  @ApiResponse({ status: 200, description: 'Rapport soumis' })
  @ApiResponse({ status: 400, description: 'Rapport déjà soumis ou invalide' })
  async soumettre(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rapportsService.soumettre(id, user);
  }

  @Post(':id/valider')
  @ApiOperation({ summary: 'Valider ou rejeter un rapport (hiérarchique)' })
  @ApiResponse({ status: 200, description: 'Action effectuée' })
  @ApiResponse({
    status: 400,
    description: 'Action invalide ou commentaire manquant',
  })
  @ApiResponse({
    status: 403,
    description: 'Non autorisé à valider ce rapport',
  })
  async valider(
    @Param('id') id: string,
    @Body() validerDto: ValiderRapportDto,
    @CurrentUser() user: any,
  ) {
    return this.rapportsService.valider(id, validerDto, user);
  }
}
