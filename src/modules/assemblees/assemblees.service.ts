import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAssembleeDto } from './dto/create-assemblee.dto';
import { UpdateAssembleeDto } from './dto/update-assemblee.dto';
import { FilterAssembleeDto } from './dto/filter-assemblee.dto';
import { UserRole, NiveauTerritoire } from '@prisma/client';

@Injectable()
export class AssembleesService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // HELPERS - PÉRIMÈTRE HIÉRARCHIQUE
  // ============================================================

  private async getTerritoireFilter(user: any): Promise<any> {
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
    return { territoireId: { in: territoireIds } };
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

  /**
   * Vérifie que l'utilisateur a le droit d'accéder à une assemblée.
   * - Admin système : tout est permis.
   * - Dirigeant direct (via AssembleeDirigeant) : permis.
   * - Autres rôles hiérarchiques : permis si l'assemblée est dans leur périmètre.
   */
  private async verifierAccesAssemblee(assembleeId: string, user: any) {
    if (user.role === UserRole.ADMIN_SYSTEME) return;

    const assemblee = await this.prisma.assemblee.findUnique({
      where: { id: assembleeId },
      include: { territoire: true },
    });

    if (!assemblee) throw new NotFoundException('Assemblée non trouvée.');

    // Vérifier si l'utilisateur est un dirigeant direct (quel que soit son rôle)
    const isDirigeant = await this.prisma.assembleeDirigeant.findUnique({
      where: {
        assembleeId_userId: {
          assembleeId: assemblee.id,
          userId: user.id,
        },
      },
    });
    if (isDirigeant) return; // Accès autorisé

    // Sinon, appliquer le périmètre hiérarchique (pour les rôles supérieurs)
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

  async create(createDto: CreateAssembleeDto, user: any) {
    // Vérifier les droits sur le territoire
    const territoire = await this.prisma.territoire.findUnique({
      where: { id: createDto.territoireId },
    });
    if (!territoire) throw new NotFoundException('Territoire non trouvé.');

    // Seul un territoire de niveau SECTEUR peut accueillir une assemblée
    if (territoire.niveau !== NiveauTerritoire.SECTEUR) {
      throw new BadRequestException(
        'Une assemblée doit être rattachée à un territoire de niveau SECTEUR.',
      );
    }

    // Vérifier l'accès pour les non‑admins
    if (user.role !== UserRole.ADMIN_SYSTEME) {
      const utilisateur = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { territoire: true },
      });
      if (!utilisateur?.territoire) {
        throw new ForbiddenException('Aucun territoire associé.');
      }
      const territoireIds = await this.getEnfantsTerritoires(
        utilisateur.territoire.id,
      );
      if (!territoireIds.includes(createDto.territoireId)) {
        throw new ForbiddenException(
          'Ce territoire est hors de votre périmètre.',
        );
      }
    }

    // Vérifier l'unicité du nom dans le territoire
    const existing = await this.prisma.assemblee.findFirst({
      where: {
        nom: { equals: createDto.nom, mode: 'insensitive' },
        territoireId: createDto.territoireId,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Une assemblée avec ce nom existe déjà dans ce territoire.',
      );
    }

    // Extraire les dirigeants pour les relier via la table de liaison
    const { dirigeantIds, ...data } = createDto;

    const assemblee = await this.prisma.assemblee.create({
      data: {
        ...data,
        // Créer les relations dans AssembleeDirigeant
        dirigeants: dirigeantIds
          ? { create: dirigeantIds.map((userId) => ({ userId })) }
          : undefined,
      },
      include: {
        territoire: { select: { id: true, nom: true, niveau: true } },
        dirigeants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                prenom: true,
                nom: true,
                contact: true,
              },
            },
          },
        },
      },
    });
    return assemblee;
  }

  async findAll(filters: FilterAssembleeDto, user: any) {
    const { search, territoireId, page = 1, limit = 20 } = filters;
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const where: any = {};

    const territoireFilter = await this.getTerritoireFilter(user);
    Object.assign(where, territoireFilter);

    if (search) {
      where.nom = { contains: search, mode: 'insensitive' };
    }
    if (territoireId) {
      where.territoireId = territoireId;
    }

    const [assemblees, total] = await Promise.all([
      this.prisma.assemblee.findMany({
        where,
        skip,
        take,
        orderBy: { dateCreation: 'desc' },
        include: {
          territoire: { select: { id: true, nom: true, niveau: true } },
          dirigeants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  prenom: true,
                  nom: true,
                  contact: true,
                },
              },
            },
          },
          _count: { select: { membres: true, rapports: true } },
        },
      }),
      this.prisma.assemblee.count({ where }),
    ]);

    return {
      data: assemblees,
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string, user: any) {
    const assemblee = await this.prisma.assemblee.findUnique({
      where: { id },
      include: {
        territoire: { select: { id: true, nom: true, niveau: true } },
        dirigeants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                prenom: true,
                nom: true,
                contact: true,
              },
            },
          },
        },
        membres: {
          select: { id: true, nom: true, prenom: true, statut: true },
        },
        rapports: {
          select: {
            id: true,
            periode: true,
            statut: true,
            dateSoumission: true,
          },
          orderBy: { dateSoumission: 'desc' },
          take: 10,
        },
      },
    });
    if (!assemblee) throw new NotFoundException('Assemblée non trouvée.');
    await this.verifierAccesAssemblee(assemblee.id, user);
    return assemblee;
  }

  async update(id: string, updateDto: UpdateAssembleeDto, user: any) {
    const assemblee = await this.prisma.assemblee.findUnique({ where: { id } });
    if (!assemblee) throw new NotFoundException('Assemblée non trouvée.');
    await this.verifierAccesAssemblee(assemblee.id, user);

    const { dirigeantIds, ...data } = updateDto;

    if (dirigeantIds !== undefined) {
      // Supprimer toutes les relations existantes
      await this.prisma.assembleeDirigeant.deleteMany({
        where: { assembleeId: id },
      });
      // Recréer les nouvelles
      if (dirigeantIds.length > 0) {
        await this.prisma.assembleeDirigeant.createMany({
          data: dirigeantIds.map((userId) => ({ assembleeId: id, userId })),
        });
      }
    }

    const updated = await this.prisma.assemblee.update({
      where: { id },
      data,
      include: {
        territoire: { select: { id: true, nom: true, niveau: true } },
        dirigeants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                prenom: true,
                nom: true,
                contact: true,
              },
            },
          },
        },
      },
    });
    return updated;
  }

  async remove(id: string, user: any) {
    const assemblee = await this.prisma.assemblee.findUnique({
      where: { id },
      include: { _count: { select: { membres: true, rapports: true } } },
    });
    if (!assemblee) throw new NotFoundException('Assemblée non trouvée.');
    await this.verifierAccesAssemblee(assemblee.id, user);

    if (assemblee._count.membres > 0 || assemblee._count.rapports > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une assemblée qui a des membres ou des rapports.',
      );
    }

    await this.prisma.assemblee.delete({ where: { id } });
    return { message: 'Assemblée supprimée avec succès.' };
  }
}
