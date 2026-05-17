import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MembresService } from './membres.service';
import { CreateMembreDto } from './dto/create-membre.dto';
import { UpdateMembreDto } from './dto/update-membre.dto';
import { FilterMembreDto } from './dto/filter-membre.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Membres')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('membres')
export class MembresController {
  constructor(private readonly membresService: MembresService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un membre' })
  @ApiResponse({ status: 201, description: 'Membre créé avec succès.' })
  create(@Body() createMembreDto: CreateMembreDto, @CurrentUser() user: any) {
    return this.membresService.create(createMembreDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les membres' })
  findAll(@Query() filters: FilterMembreDto, @CurrentUser() user: any) {
    return this.membresService.findAll(filters, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un membre par ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.membresService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un membre' })
  update(
    @Param('id') id: string,
    @Body() updateMembreDto: UpdateMembreDto,
    @CurrentUser() user: any,
  ) {
    return this.membresService.update(id, updateMembreDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un membre' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.membresService.remove(id, user);
  }

  @Get(':id/historique')
  @ApiOperation({ summary: "Historique des rapports de l'assemblée du membre" })
  getHistorique(@Param('id') id: string, @CurrentUser() user: any) {
    return this.membresService.getHistorique(id, user);
  }
}
