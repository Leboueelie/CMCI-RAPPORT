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
import { TerritoiresService } from './territoires.service';
import { CreateTerritoireDto } from './dto/create-territoire.dto';
import { UpdateTerritoireDto } from './dto/update-territoire.dto';
import { FilterTerritoireDto } from './dto/filter-territoire.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Territoires')
@Controller('territoires')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TerritoiresController {
  constructor(private territoiresService: TerritoiresService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des territoires (filtrable)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'niveau', enum: UserRole, required: false })
  @ApiQuery({ name: 'parentId', required: false })
  @ApiResponse({ status: 200, description: 'Liste récupérée avec succès' })
  async findAll(@Query() filter: FilterTerritoireDto) {
    return this.territoiresService.findAll(filter);
  }

  @Get('arbre')
  @ApiOperation({ summary: 'Arbre hiérarchique complet' })
  @ApiResponse({ status: 200, description: 'Arbre hiérarchique' })
  async findArbre() {
    return this.territoiresService.findArbreComplet();
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un territoire" })
  @ApiResponse({ status: 200, description: 'Territoire trouvé' })
  @ApiResponse({ status: 404, description: 'Territoire non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.territoiresService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_SYSTEME)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un territoire (admin only)' })
  @ApiResponse({ status: 201, description: 'Territoire créé' })
  @ApiResponse({ status: 400, description: 'Erreur de hiérarchie' })
  @ApiResponse({ status: 409, description: 'Nom déjà utilisé' })
  async create(@Body() createDto: CreateTerritoireDto) {
    return this.territoiresService.create(createDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_SYSTEME)
  @ApiOperation({ summary: 'Modifier un territoire (admin only)' })
  @ApiResponse({ status: 200, description: 'Territoire modifié' })
  @ApiResponse({ status: 400, description: 'Erreur de hiérarchie ou cycle' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTerritoireDto,
  ) {
    return this.territoiresService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_SYSTEME)
  @ApiOperation({ summary: 'Supprimer un territoire (admin only)' })
  @ApiResponse({ status: 200, description: 'Territoire supprimé' })
  @ApiResponse({ status: 400, description: 'Territoire a des dépendances' })
  async remove(@Param('id') id: string) {
    return this.territoiresService.remove(id);
  }
}
