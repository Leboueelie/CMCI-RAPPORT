import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssembleesService } from './assemblees.service';
import { CreateAssembleeDto } from './dto/create-assemblee.dto';
import { UpdateAssembleeDto } from './dto/update-assemblee.dto';
import { FilterAssembleeDto } from './dto/filter-assemblee.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Assemblees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assemblees')
export class AssembleesController {
  constructor(private readonly assembleesService: AssembleesService) {}

  @Get()
  @Roles(
    UserRole.ADMIN_SYSTEME,
    UserRole.DIRIGEANT_ASSEMBLEE,
    UserRole.DIRIGEANT_ZONE,
    UserRole.MISSIONNAIRE,
    UserRole.RESPONSABLE_REGIONAL,
    UserRole.RESPONSABLE_NATIONAL,
  )
  @ApiOperation({ summary: 'Lister les assemblées' })
  findAll(@Query() filter: FilterAssembleeDto, @CurrentUser() user: any) {
    return this.assembleesService.findAll(filter, user);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN_SYSTEME,
    UserRole.DIRIGEANT_ASSEMBLEE,
    UserRole.DIRIGEANT_ZONE,
    UserRole.MISSIONNAIRE,
    UserRole.RESPONSABLE_REGIONAL,
    UserRole.RESPONSABLE_NATIONAL,
  )
  @ApiOperation({ summary: 'Obtenir une assemblée par ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assembleesService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN_SYSTEME, UserRole.DIRIGEANT_ZONE)
  @ApiOperation({ summary: 'Créer une assemblée' })
  create(@Body() createDto: CreateAssembleeDto, @CurrentUser() user: any) {
    return this.assembleesService.create(createDto, user);
  }

  @Put(':id')
  @Roles(
    UserRole.ADMIN_SYSTEME,
    UserRole.DIRIGEANT_ZONE,
    UserRole.DIRIGEANT_ASSEMBLEE,
  )
  @ApiOperation({ summary: 'Modifier une assemblée' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAssembleeDto,
    @CurrentUser() user: any,
  ) {
    return this.assembleesService.update(id, updateDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN_SYSTEME, UserRole.DIRIGEANT_ZONE)
  @ApiOperation({ summary: 'Supprimer une assemblée' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assembleesService.remove(id, user);
  }
}
