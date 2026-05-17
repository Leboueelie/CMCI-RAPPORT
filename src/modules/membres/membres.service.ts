import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMembreDto } from './dto/create-membre.dto';
import { UpdateMembreDto } from './dto/update-membre.dto';
import { FilterMembreDto } from './dto/filter-membre.dto';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class MembresService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // HELPERS - PÉRIMÈTRE HIÉRARCHIQUE
  // ============================================================

  private async getTerritoireFilter(
    user: any,
  ): Promise<Prisma.MembreWhereInput> {
    if (user.role === UserRole.ADMIN_SYSTEME) {
      return {};
    }

    const utilisateur = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { territoire: true },
    });

    if (!utilisateur?.territoire) {
      throw new ForbiddenException('Aucun territoire associé à votre compte.');
    }

    const territoireIds = await this.getEnfantsTerritoires(
      utilisateur.territoire.id,
    );

    return {
      assemblee: {
        territoireId: { in: territoireIds },
      },
    };
  }

  private async getEnfantsTerritoires(parentId: string): Promise<string[]> {
    const enfants = await this.prisma.territoire.findMany({
      where: { parentId },
      select: { id: true },
    });

    let ids = [parentId];
    for (const enfant of enfants) {
      const subIds = await this.getEnfantsTerritoires(enfant.id);
      ids = ids.concat(subIds);
    }
    return ids;
  }

  private async verifierAccesAssemblee(assembleeId: string, user: any) {
    if (user.role === UserRole.ADMIN_SYSTEME) return;

    const assemblee = await this.prisma.assemblee.findUnique({
      where: { id: assembleeId },
      include: { territoire: true },
    });

    if (!assemblee) throw new NotFoundException('Assemblée non trouvée.');

    // Vérifier si l'utilisateur est un dirigeant direct de cette assemblée
    const isDirigeant = await this.prisma.assembleeDirigeant.findUnique({
      where: {
        assembleeId_userId: {
          assembleeId: assemblee.id,
          userId: user.id,
        },
      },
    });
    if (isDirigeant) return; // Il a le droit de gérer les membres

    // Sinon, vérifier le périmètre hiérarchique pour les rôles supérieurs
    const utilisateur = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { territoire: true },
    });

    if (!utilisateur?.territoire) {
      throw new ForbiddenException('Aucun territoire associé à votre compte.');
    }

    const territoireIds = await this.getEnfantsTerritoires(
      utilisateur.territoire.id,
    );
    if (!territoireIds.includes(assemblee.territoireId)) {
      throw new ForbiddenException(
        'Cette assemblée est hors de votre périmètre.',
      );
    }
  }

  // ============================================================
  // CRUD
  // ============================================================

  async create(createMembreDto: CreateMembreDto, user: any) {
    await this.verifierAccesAssemblee(createMembreDto.assembleeId, user);

    const assemblee = await this.prisma.assemblee.findUnique({
      where: { id: createMembreDto.assembleeId },
    });
    if (!assemblee) throw new NotFoundException('Assemblée non trouvée.');

    const { fonctionIds, ...rest } = createMembreDto;

    const data: any = {
      ...rest,
      dateNaissance: rest.dateNaissance ? new Date(rest.dateNaissance) : null,
      dateConversion: rest.dateConversion,
      profession: createMembreDto.profession,
      fonctions: fonctionIds
        ? {
            create: fonctionIds.map((fonctionId) => ({
              fonction: { connect: { id: fonctionId } },
            })),
          }
        : undefined,
    };

    const membre = await this.prisma.membre.create({
      data,
      include: {
        assemblee: true,
        fonctions: { include: { fonction: true } },
      },
    });
    return membre;
  }

  async findAll(filters: FilterMembreDto, user: any) {
    const { search, statut, assembleeId, page = 1, limit = 20 } = filters;
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const where: Prisma.MembreWhereInput = {};

    const territoireFilter = await this.getTerritoireFilter(user);
    Object.assign(where, territoireFilter);

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (statut) where.statut = statut;
    if (assembleeId) where.assembleeId = assembleeId;

    const [membres, total] = await Promise.all([
      this.prisma.membre.findMany({
        where,
        include: {
          assemblee: true,
          fonctions: { include: { fonction: true } },
        },
        skip,
        take,
        orderBy: { nom: 'asc' },
      }),
      this.prisma.membre.count({ where }),
    ]);

    return {
      data: membres,
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string, user: any) {
    const membre = await this.prisma.membre.findUnique({
      where: { id },
      include: {
        assemblee: true,
        fonctions: { include: { fonction: true } },
      },
    });
    if (!membre) throw new NotFoundException('Membre non trouvé.');
    await this.verifierAccesAssemblee(membre.assembleeId, user);
    return membre;
  }

  async update(id: string, updateMembreDto: UpdateMembreDto, user: any) {
    const membre = await this.prisma.membre.findUnique({
      where: { id },
      select: { assembleeId: true },
    });
    if (!membre) throw new NotFoundException('Membre non trouvé.');
    await this.verifierAccesAssemblee(membre.assembleeId, user);

    const { fonctionIds, ...rest } = updateMembreDto;
    const data: any = { ...rest };

    if (data.dateNaissance) data.dateNaissance = new Date(data.dateNaissance);

    if (fonctionIds !== undefined) {
      // Supprimer toutes les fonctions existantes
      await this.prisma.membreFonction.deleteMany({ where: { membreId: id } });
      // Recréer les nouvelles
      data.fonctions = {
        create: fonctionIds.map((fonctionId) => ({
          fonction: { connect: { id: fonctionId } },
        })),
      };
    }

    const updated = await this.prisma.membre.update({
      where: { id },
      data,
      include: {
        assemblee: true,
        fonctions: { include: { fonction: true } },
      },
    });
    return updated;
  }

  async remove(id: string, user: any) {
    const membre = await this.prisma.membre.findUnique({
      where: { id },
      select: { assembleeId: true },
    });
    if (!membre) throw new NotFoundException('Membre non trouvé.');
    await this.verifierAccesAssemblee(membre.assembleeId, user);

    await this.prisma.membre.delete({ where: { id } });
    return { message: 'Membre supprimé avec succès.' };
  }

  async getHistorique(id: string, user: any) {
    const membre = await this.prisma.membre.findUnique({
      where: { id },
      select: { assembleeId: true, assemblee: true },
    });
    if (!membre) throw new NotFoundException('Membre non trouvé.');
    await this.verifierAccesAssemblee(membre.assembleeId, user);

    const rapports = await this.prisma.rapport.findMany({
      where: { assembleeId: membre.assembleeId },
      orderBy: { dateSoumission: 'desc' },
      select: {
        id: true,
        periode: true,
        statut: true,
        dateSoumission: true,
        soumisPar: { select: { username: true } },
      },
    });

    return {
      membre: {
        id: membre.assemblee.id,
        nom: membre.assemblee.nom,
      },
      rapports,
    };
  }
}
