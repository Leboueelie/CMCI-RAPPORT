import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole, StatutRapport } from '@prisma/client';
import { FilterDashboardDto } from './dto/filter-dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

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

  async getSummary(user: any, filters?: FilterDashboardDto) {
    const utilisateur = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { territoire: true },
    });

    if (!utilisateur?.territoire && user.role !== UserRole.ADMIN_SYSTEME) {
      throw new ForbiddenException('Aucun territoire associé à votre compte.');
    }

    // Construire le filtre de périmètre
    let territoireIds: string[] = [];

    if (user.role === UserRole.ADMIN_SYSTEME) {
      // Admin voit tout
      if (filters?.territoireId) {
        territoireIds = await this.getEnfantsTerritoires(filters.territoireId);
      }
    } else if (utilisateur?.territoire) {
      territoireIds = await this.getEnfantsTerritoires(
        utilisateur.territoire.id,
      );
    }

    const whereTerritoire =
      territoireIds.length > 0 ? { territoireId: { in: territoireIds } } : {};

    // Filtre de date pour les rapports
    const whereDate: any = {};
    if (filters?.dateDebut) whereDate.gte = new Date(filters.dateDebut);
    if (filters?.dateFin) whereDate.lte = new Date(filters.dateFin);

    const whereRapports = {
      ...whereTerritoire,
      ...(filters?.dateDebut || filters?.dateFin
        ? { dateSoumission: whereDate }
        : {}),
    };

    // === STATS GLOBALES ===
    const [
      totalAssemblees,
      totalMembres,
      totalRapports,
      rapportsBrouillon,
      rapportsSoumis,
      rapportsValides,
      rapportsRejetes,
      totalUsers,
      usersActifs,
      usersInactifs,
    ] = await Promise.all([
      this.prisma.assemblee.count({ where: whereTerritoire }),
      this.prisma.membre.count({
        where: {
          assemblee: {
            territoireId:
              territoireIds.length > 0 ? { in: territoireIds } : undefined,
          },
        },
      }),
      this.prisma.rapport.count({ where: whereRapports }),
      this.prisma.rapport.count({
        where: { ...whereRapports, statut: StatutRapport.BROUILLON },
      }),
      this.prisma.rapport.count({
        where: { ...whereRapports, statut: StatutRapport.SOUMIS },
      }),
      this.prisma.rapport.count({
        where: { ...whereRapports, statut: StatutRapport.VALIDE },
      }),
      this.prisma.rapport.count({
        where: { ...whereRapports, statut: StatutRapport.REJETE },
      }),
      this.prisma.user.count({
        where: {
          territoireId:
            territoireIds.length > 0 ? { in: territoireIds } : undefined,
        },
      }),
      this.prisma.user.count({
        where: {
          isActive: true,
          territoireId:
            territoireIds.length > 0 ? { in: territoireIds } : undefined,
        },
      }),
      this.prisma.user.count({
        where: {
          isActive: false,
          territoireId:
            territoireIds.length > 0 ? { in: territoireIds } : undefined,
        },
      }),
    ]);

    // === RAPPORTS EN ATTENTE (pour validateurs) ===
    let rapportsAttente: any[] = [];
    if (
      user.role === UserRole.DIRIGEANT_ZONE ||
      user.role === UserRole.MISSIONNAIRE ||
      user.role === UserRole.RESPONSABLE_REGIONAL ||
      user.role === UserRole.RESPONSABLE_NATIONAL ||
      user.role === UserRole.ADMIN_SYSTEME
    ) {
      rapportsAttente = await this.prisma.rapport.findMany({
        where: {
          ...whereRapports,
          statut: StatutRapport.SOUMIS,
        },
        orderBy: { dateSoumission: 'asc' },
        take: 5,
        include: {
          assemblee: { select: { id: true, nom: true } },
          territoire: { select: { id: true, nom: true, niveau: true } },
          soumisPar: {
            select: { id: true, username: true, prenom: true, nom: true },
          },
        },
      });
    }

    // === RAPPORTS EN RETARD (pas de rapport ce mois-ci) ===
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const assembleesSansRapport = await this.prisma.assemblee.findMany({
      where: {
        ...whereTerritoire,
        rapports: {
          none: {
            dateSoumission: {
              gte: debutMois,
            },
          },
        },
      },
      select: {
        id: true,
        nom: true,
        territoire: { select: { id: true, nom: true } },
      },
      take: 5,
    });

    // === STATS PAR MOIS (pour graphique) ===
    const statsMensuelles = await this.getStatsMensuelles(whereRapports);

    return {
      global: {
        assemblees: totalAssemblees,
        membres: totalMembres,
        rapports: {
          total: totalRapports,
          brouillon: rapportsBrouillon,
          soumis: rapportsSoumis,
          valides: rapportsValides,
          rejetes: rapportsRejetes,
        },
        utilisateurs: {
          total: totalUsers,
          actifs: usersActifs,
          inactifs: usersInactifs,
        },
      },
      attente: {
        total: rapportsSoumis,
        rapports: rapportsAttente,
      },
      retard: {
        total: assembleesSansRapport.length,
        assemblees: assembleesSansRapport,
      },
      mensuel: statsMensuelles,
      perimetre: {
        role: user.role,
        territoire: utilisateur?.territoire?.nom || 'Global',
      },
    };
  }

  async getStatsByTerritoire(territoireId: string, user: any) {
    // Vérifier l'accès
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
      if (!territoireIds.includes(territoireId)) {
        throw new ForbiddenException(
          'Ce territoire est hors de votre périmètre.',
        );
      }
    }

    const territoire = await this.prisma.territoire.findUnique({
      where: { id: territoireId },
      include: {
        enfants: { select: { id: true, nom: true, niveau: true } },
      },
    });

    if (!territoire) {
      throw new ForbiddenException('Territoire non trouvé.');
    }

    const territoireIds = await this.getEnfantsTerritoires(territoireId);

    const [
      totalAssemblees,
      totalMembres,
      totalRapports,
      rapportsValides,
      rapportsSoumis,
    ] = await Promise.all([
      this.prisma.assemblee.count({
        where: { territoireId: { in: territoireIds } },
      }),
      this.prisma.membre.count({
        where: {
          assemblee: { territoireId: { in: territoireIds } },
        },
      }),
      this.prisma.rapport.count({
        where: { territoireId: { in: territoireIds } },
      }),
      this.prisma.rapport.count({
        where: {
          territoireId: { in: territoireIds },
          statut: StatutRapport.VALIDE,
        },
      }),
      this.prisma.rapport.count({
        where: {
          territoireId: { in: territoireIds },
          statut: StatutRapport.SOUMIS,
        },
      }),
    ]);

    return {
      territoire: {
        id: territoire.id,
        nom: territoire.nom,
        niveau: territoire.niveau,
      },
      stats: {
        assemblees: totalAssemblees,
        membres: totalMembres,
        rapports: {
          total: totalRapports,
          valides: rapportsValides,
          soumis: rapportsSoumis,
        },
      },
      sousTerritoires: territoire.enfants,
    };
  }

  // ==================== MÉTHODES PRIVÉES ====================

  private async getStatsMensuelles(whereRapports: any): Promise<any[]> {
    const sixMoisAvant = new Date();
    sixMoisAvant.setMonth(sixMoisAvant.getMonth() - 5);
    sixMoisAvant.setDate(1);

    const rapports = await this.prisma.rapport.findMany({
      where: {
        ...whereRapports,
        dateSoumission: {
          gte: sixMoisAvant,
        },
      },
      select: {
        statut: true,
        dateSoumission: true,
      },
    });

    // Grouper par mois
    const statsParMois: Record<string, any> = {};

    for (const rapport of rapports) {
      if (!rapport.dateSoumission) continue;

      const mois = rapport.dateSoumission.toISOString().slice(0, 7); // YYYY-MM
      const nomMois = rapport.dateSoumission.toLocaleDateString('fr-FR', {
        month: 'short',
        year: 'numeric',
      });

      if (!statsParMois[mois]) {
        statsParMois[mois] = {
          mois: nomMois,
          soumis: 0,
          valides: 0,
          rejetes: 0,
        };
      }

      if (rapport.statut === StatutRapport.SOUMIS) statsParMois[mois].soumis++;
      if (rapport.statut === StatutRapport.VALIDE) statsParMois[mois].valides++;
      if (rapport.statut === StatutRapport.REJETE) statsParMois[mois].rejetes++;
    }

    return Object.values(statsParMois);
  }
}
