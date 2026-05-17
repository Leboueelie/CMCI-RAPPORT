import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTerritoireDto } from './dto/create-territoire.dto';
import { UpdateTerritoireDto } from './dto/update-territoire.dto';
import { FilterTerritoireDto } from './dto/filter-territoire.dto';
import { NiveauTerritoire } from '@prisma/client';

@Injectable()
export class TerritoiresService {
  constructor(private prisma: PrismaService) {}

  // Ordre hiérarchique pour le tri
  private readonly niveauOrdre = {
    [NiveauTerritoire.PAYS]: 1,
    [NiveauTerritoire.REGION]: 2,
    [NiveauTerritoire.VILLE]: 3,
    [NiveauTerritoire.QUARTIER]: 4,
    [NiveauTerritoire.SECTEUR]: 5,
  };

  async findAll(filter: FilterTerritoireDto) {
    const { search, niveau, parentId } = filter;

    const where: any = {};

    if (search) {
      where.nom = { contains: search, mode: 'insensitive' };
    }

    if (niveau) where.niveau = niveau;
    if (parentId) where.parentId = parentId;

    const territoires = await this.prisma.territoire.findMany({
      where,
      include: {
        parent: { select: { id: true, nom: true, niveau: true } },
        enfants: { select: { id: true, nom: true, niveau: true } },
        _count: { select: { users: true, assemblees: true } },
      },
      orderBy: [{ niveau: 'asc' }, { nom: 'asc' }],
    });

    return territoires;
  }

  async findArbreComplet() {
    // Récupère l'arbre hiérarchique complet (top-down)
    const tous = await this.prisma.territoire.findMany({
      include: {
        enfants: {
          include: {
            enfants: {
              include: {
                enfants: {
                  include: {
                    enfants: true, // 5 niveaux max
                  },
                },
              },
            },
          },
        },
        _count: { select: { users: true, assemblees: true } },
      },
      orderBy: [{ niveau: 'asc' }, { nom: 'asc' }],
    });

    // Ne retourne que les racines (sans parent)
    return tous.filter((t) => t.parentId === null);
  }

  async findOne(id: string) {
    const territoire = await this.prisma.territoire.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, nom: true, niveau: true } },
        enfants: {
          select: { id: true, nom: true, niveau: true, contact: true },
          orderBy: { nom: 'asc' },
        },
        users: {
          select: {
            id: true,
            username: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        assemblees: {
          select: { id: true, nom: true, contact: true },
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

    if (!territoire) {
      throw new NotFoundException('Territoire non trouvé');
    }

    return territoire;
  }

  async create(createDto: CreateTerritoireDto) {
    // Validation hiérarchique
    if (createDto.parentId) {
      await this.validerHiérarchie(createDto.parentId, createDto.niveau);
    } else if (createDto.niveau !== NiveauTerritoire.PAYS) {
      throw new BadRequestException(
        'Seul un territoire de niveau PAYS peut être créé sans parent',
      );
    }

    const existing = await this.prisma.territoire.findFirst({
      where: { nom: { equals: createDto.nom, mode: 'insensitive' } },
    });

    if (existing) {
      throw new ConflictException('Un territoire avec ce nom existe déjà');
    }

    return this.prisma.territoire.create({
      data: createDto,
      include: {
        parent: { select: { id: true, nom: true, niveau: true } },
      },
    });
  }

  async update(id: string, updateDto: UpdateTerritoireDto) {
    const territoire = await this.prisma.territoire.findUnique({
      where: { id },
    });
    if (!territoire) {
      throw new NotFoundException('Territoire non trouvé');
    }

    // Si on change le parent ou le niveau, valider la cohérence
    if (updateDto.parentId || updateDto.niveau) {
      const newParentId = updateDto.parentId ?? territoire.parentId;
      const newNiveau = updateDto.niveau ?? territoire.niveau;

      if (newParentId) {
        await this.validerHiérarchie(newParentId, newNiveau);
      } else if (newNiveau !== NiveauTerritoire.PAYS) {
        throw new BadRequestException(
          'Seul un territoire de niveau PAYS peut exister sans parent',
        );
      }
    }

    // Empêcher de créer un cycle (se déplacer sous un de ses descendants)
    if (updateDto.parentId) {
      await this.empêcherCycle(id, updateDto.parentId);
    }

    return this.prisma.territoire.update({
      where: { id },
      data: updateDto,
      include: {
        parent: { select: { id: true, nom: true, niveau: true } },
      },
    });
  }

  async remove(id: string) {
    const territoire = await this.prisma.territoire.findUnique({
      where: { id },
      include: { enfants: true, users: true, assemblees: true },
    });

    if (!territoire) {
      throw new NotFoundException('Territoire non trouvé');
    }

    if (territoire.enfants.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer un territoire qui a des sous-territoires',
      );
    }

    if (territoire.users.length > 0 || territoire.assemblees.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer un territoire qui a des utilisateurs ou des assemblées',
      );
    }

    await this.prisma.territoire.delete({ where: { id } });
    return { message: 'Territoire supprimé avec succès' };
  }

  // ==================== MÉTHODES PRIVÉES ====================

  private async validerHiérarchie(
    parentId: string,
    niveauEnfant: NiveauTerritoire,
  ) {
    const parent = await this.prisma.territoire.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException('Territoire parent non trouvé');
    }

    const ordreParent = this.niveauOrdre[parent.niveau];
    const ordreEnfant = this.niveauOrdre[niveauEnfant];

    if (ordreEnfant <= ordreParent) {
      throw new BadRequestException(
        `Un territoire de niveau ${niveauEnfant} ne peut pas être rattaché à un territoire de niveau ${parent.niveau}`,
      );
    }

    if (ordreEnfant - ordreParent !== 1) {
      throw new BadRequestException(
        `Le niveau ${niveauEnfant} doit être directement sous ${parent.niveau} (pas de saut hiérarchique)`,
      );
    }
  }

  private async empêcherCycle(territoireId: string, nouveauParentId: string) {
    let current = await this.prisma.territoire.findUnique({
      where: { id: nouveauParentId },
      select: { id: true, parentId: true },
    });

    while (current) {
      if (current.id === territoireId) {
        throw new BadRequestException(
          'Impossible de déplacer un territoire sous un de ses propres descendants (cycle détecté)',
        );
      }
      if (!current.parentId) break;
      current = await this.prisma.territoire.findUnique({
        where: { id: current.parentId },
        select: { id: true, parentId: true },
      });
    }
  }
}
