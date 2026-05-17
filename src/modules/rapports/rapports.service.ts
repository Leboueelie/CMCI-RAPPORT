import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRapportDto } from './dto/create-rapport.dto';
import { UpdateRapportDto } from './dto/update-rapport.dto';
import { FilterRapportDto } from './dto/filter-rapport.dto';
import { ValiderRapportDto } from './dto/valider-rapport.dto';
import { StatutRapport, UserRole, NiveauTerritoire } from '@prisma/client';

@Injectable()
export class RapportsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

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

  private async verifierAccesRapport(rapport: any, user: any): Promise<void> {
    if (user.role === UserRole.ADMIN_SYSTEME) return;

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
    if (!territoireIds.includes(rapport.territoireId)) {
      throw new ForbiddenException('Ce rapport est hors de votre périmètre.');
    }
  }

  private async getNiveauValidation(
    role: UserRole,
  ): Promise<NiveauTerritoire | null> {
    const mapping = {
      [UserRole.DIRIGEANT_ZONE]: NiveauTerritoire.QUARTIER,
      [UserRole.MISSIONNAIRE]: NiveauTerritoire.VILLE,
      [UserRole.RESPONSABLE_REGIONAL]: NiveauTerritoire.REGION,
      [UserRole.RESPONSABLE_NATIONAL]: NiveauTerritoire.PAYS,
    };
    return mapping[role] || null;
  }

  private async peutValider(rapport: any, user: any): Promise<boolean> {
    if (user.role === UserRole.ADMIN_SYSTEME) return true;

    const niveauValidation = await this.getNiveauValidation(user.role);
    if (!niveauValidation) return false;

    const utilisateur = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { territoire: true },
    });

    if (!utilisateur?.territoire) return false;

    const hierarchie: any[] = [];
    let current = await this.prisma.territoire.findUnique({
      where: { id: rapport.territoireId },
    });

    while (current) {
      hierarchie.push(current);
      if (!current.parentId) break;
      current = await this.prisma.territoire.findUnique({
        where: { id: current.parentId },
      });
    }

    const territoireValidation = hierarchie.find(
      (t) => t.niveau === niveauValidation,
    );
    if (!territoireValidation) return false;

    return territoireValidation.id === utilisateur.territoireId;
  }

  // ============================================================
  // CRUD
  // ============================================================

  async create(createDto: CreateRapportDto, user: any) {
    const assemblee = await this.prisma.assemblee.findUnique({
      where: { id: createDto.assembleeId },
      include: { territoire: true },
    });

    if (!assemblee) {
      throw new NotFoundException('Assemblée non trouvée.');
    }

    if (assemblee.territoireId !== createDto.territoireId) {
      throw new BadRequestException(
        "Le territoire ne correspond pas à l'assemblée.",
      );
    }

    // Vérification : l'utilisateur doit être admin ou dirigeant direct de l'assemblée
    if (user.role !== UserRole.ADMIN_SYSTEME) {
      const isDirigeant = await this.prisma.assembleeDirigeant.findUnique({
        where: {
          assembleeId_userId: {
            assembleeId: assemblee.id,
            userId: user.id,
          },
        },
      });
      if (!isDirigeant) {
        throw new ForbiddenException(
          'Vous ne pouvez créer des rapports que pour votre assemblée.',
        );
      }
    }

    const existing = await this.prisma.rapport.findFirst({
      where: {
        assembleeId: createDto.assembleeId,
        periode: createDto.periode,
      },
    });

    if (existing) {
      throw new ConflictException('Un rapport existe déjà pour cette période.');
    }

    return this.prisma.rapport.create({
      data: {
        assembleeId: createDto.assembleeId,
        territoireId: createDto.territoireId,
        periode: createDto.periode,
        dateDebut: new Date(createDto.dateDebut),
        dateFin: new Date(createDto.dateFin),
        activites: createDto.activites,
        effectifs: createDto.effectifs,
        temoignages: createDto.temoignages,
        problemes: createDto.problemes,
        besoins: createDto.besoins,
        recommandations: createDto.recommandations,
        fichierJoint: createDto.fichierJoint,
        soumisParId: user.id,
        statut: StatutRapport.BROUILLON,
      },
      include: {
        assemblee: { select: { id: true, nom: true } },
        soumisPar: {
          select: { id: true, username: true, prenom: true, nom: true },
        },
      },
    });
  }

  async findAll(filters: FilterRapportDto, user: any) {
    const {
      statut,
      assembleeId,
      periode,
      dateDebut,
      dateFin,
      page = 1,
      limit = 20,
    } = filters;
    // Conversion explicite en nombre
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const where: any = {};

    const territoireFilter = await this.getTerritoireFilter(user);
    Object.assign(where, territoireFilter);

    if (statut) where.statut = statut;
    if (assembleeId) where.assembleeId = assembleeId;
    if (periode) where.periode = { contains: periode, mode: 'insensitive' };
    if (dateDebut) where.dateDebut = { gte: new Date(dateDebut) };
    if (dateFin) where.dateFin = { lte: new Date(dateFin) };

    const [rapports, total] = await Promise.all([
      this.prisma.rapport.findMany({
        where,
        skip,
        take,
        orderBy: { dateSoumission: 'desc' },
        include: {
          assemblee: { select: { id: true, nom: true } },
          territoire: { select: { id: true, nom: true, niveau: true } },
          soumisPar: {
            select: { id: true, username: true, prenom: true, nom: true },
          },
          validePar: {
            select: { id: true, username: true, prenom: true, nom: true },
          },
          rejetePar: {
            select: { id: true, username: true, prenom: true, nom: true },
          },
        },
      }),
      this.prisma.rapport.count({ where }),
    ]);

    return {
      data: rapports,
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string, user: any) {
    const rapport = await this.prisma.rapport.findUnique({
      where: { id },
      include: {
        assemblee: { select: { id: true, nom: true, territoireId: true } },
        territoire: {
          select: { id: true, nom: true, niveau: true, parent: true },
        },
        soumisPar: {
          select: { id: true, username: true, prenom: true, nom: true },
        },
        validePar: {
          select: { id: true, username: true, prenom: true, nom: true },
        },
        rejetePar: {
          select: { id: true, username: true, prenom: true, nom: true },
        },
      },
    });

    if (!rapport) {
      throw new NotFoundException('Rapport non trouvé.');
    }

    await this.verifierAccesRapport(rapport, user);
    return rapport;
  }

  async update(id: string, updateDto: UpdateRapportDto, user: any) {
    const rapport = await this.prisma.rapport.findUnique({
      where: { id },
      include: { assemblee: true },
    });

    if (!rapport) {
      throw new NotFoundException('Rapport non trouvé.');
    }

    if (rapport.statut !== StatutRapport.BROUILLON) {
      throw new BadRequestException(
        "Un rapport ne peut être modifié qu'en statut Brouillon.",
      );
    }

    if (
      rapport.soumisParId !== user.id &&
      user.role !== UserRole.ADMIN_SYSTEME
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres rapports.',
      );
    }

    const data: any = { ...updateDto };
    if (data.dateDebut) data.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) data.dateFin = new Date(data.dateFin);

    return this.prisma.rapport.update({
      where: { id },
      data,
      include: {
        assemblee: { select: { id: true, nom: true } },
        soumisPar: {
          select: { id: true, username: true, prenom: true, nom: true },
        },
      },
    });
  }

  async remove(id: string, user: any) {
    const rapport = await this.prisma.rapport.findUnique({
      where: { id },
      select: { statut: true, soumisParId: true },
    });

    if (!rapport) {
      throw new NotFoundException('Rapport non trouvé.');
    }

    if (rapport.statut !== StatutRapport.BROUILLON) {
      throw new BadRequestException(
        "Un rapport ne peut être supprimé qu'en statut Brouillon.",
      );
    }

    if (
      rapport.soumisParId !== user.id &&
      user.role !== UserRole.ADMIN_SYSTEME
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres rapports.',
      );
    }

    await this.prisma.rapport.delete({ where: { id } });
    return { message: 'Rapport supprimé avec succès.' };
  }

  // ============================================================
  // ACTIONS DE STATUT
  // ============================================================

  async soumettre(id: string, user: any) {
    const rapport = await this.prisma.rapport.findUnique({
      where: { id },
      include: { assemblee: true },
    });

    if (!rapport) {
      throw new NotFoundException('Rapport non trouvé.');
    }

    if (rapport.statut !== StatutRapport.BROUILLON) {
      throw new BadRequestException(
        'Seuls les rapports en brouillon peuvent être soumis.',
      );
    }

    if (
      rapport.soumisParId !== user.id &&
      user.role !== UserRole.ADMIN_SYSTEME
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez soumettre que vos propres rapports.',
      );
    }

    const updated = await this.prisma.rapport.update({
      where: { id },
      data: {
        statut: StatutRapport.SOUMIS,
        dateSoumission: new Date(),
      },
      include: {
        assemblee: { select: { id: true, nom: true } },
        soumisPar: {
          select: { id: true, username: true, prenom: true, nom: true },
        },
        territoire: { select: { id: true, nom: true, parentId: true } },
      },
    });

    await this.notificationsService.notifierSoumissionRapport(updated);
    return updated;
  }

  async valider(id: string, validerDto: ValiderRapportDto, user: any) {
    const rapport = await this.prisma.rapport.findUnique({
      where: { id },
      include: { assemblee: { include: { territoire: true } } },
    });

    if (!rapport) {
      throw new NotFoundException('Rapport non trouvé.');
    }

    const peutValider = await this.peutValider(rapport, user);
    if (!peutValider) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorité de valider ce rapport.",
      );
    }

    if (validerDto.action === 'valider') {
      if (rapport.statut !== StatutRapport.SOUMIS) {
        throw new BadRequestException(
          'Seuls les rapports soumis peuvent être validés.',
        );
      }

      const updated = await this.prisma.rapport.update({
        where: { id },
        data: {
          statut: StatutRapport.VALIDE,
          valideParId: user.id,
          dateValidation: new Date(),
        },
        include: {
          assemblee: { select: { id: true, nom: true } },
          validePar: {
            select: { id: true, username: true, prenom: true, nom: true },
          },
          soumisPar: {
            select: { id: true, username: true, prenom: true, nom: true },
          },
        },
      });

      await this.notificationsService.notifierValidationRapport(updated, user);
      return updated;
    } else if (validerDto.action === 'rejeter') {
      if (
        !validerDto.commentaire ||
        validerDto.commentaire.trim().length === 0
      ) {
        throw new BadRequestException(
          'Un commentaire est obligatoire pour rejeter un rapport.',
        );
      }

      if (rapport.statut !== StatutRapport.SOUMIS) {
        throw new BadRequestException(
          'Seuls les rapports soumis peuvent être rejetés.',
        );
      }

      const updated = await this.prisma.rapport.update({
        where: { id },
        data: {
          statut: StatutRapport.REJETE,
          rejeteParId: user.id,
          dateRejet: new Date(),
          commentaireRejet: validerDto.commentaire,
        },
        include: {
          assemblee: { select: { id: true, nom: true } },
          rejetePar: {
            select: { id: true, username: true, prenom: true, nom: true },
          },
          soumisPar: {
            select: { id: true, username: true, prenom: true, nom: true },
          },
        },
      });

      await this.notificationsService.notifierRejetRapport(
        updated,
        user,
        validerDto.commentaire,
      );
      return updated;
    }

    throw new BadRequestException(
      "Action invalide. Utilisez 'valider' ou 'rejeter'.",
    );
  }
}
