import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole, StatutRapport, NiveauTerritoire } from '@prisma/client';

@Injectable()
export class ValidationsService {
  constructor(private prisma: PrismaService) {}

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

  async getFileAttente(user: any) {
    // 1. Vérifier que le rôle fait partie des validateurs (ou admin)
    if (
      user.role !== UserRole.DIRIGEANT_ZONE &&
      user.role !== UserRole.MISSIONNAIRE &&
      user.role !== UserRole.RESPONSABLE_REGIONAL &&
      user.role !== UserRole.RESPONSABLE_NATIONAL &&
      user.role !== UserRole.ADMIN_SYSTEME
    ) {
      throw new ForbiddenException("Vous n'avez pas les droits de validation.");
    }

    // 2. Traitement spécial admin : il voit TOUS les rapports soumis
    if (user.role === UserRole.ADMIN_SYSTEME) {
      const rapports = await this.prisma.rapport.findMany({
        where: { statut: StatutRapport.SOUMIS },
        orderBy: { dateSoumission: 'asc' },
        include: {
          assemblee: { select: { id: true, nom: true } },
          territoire: { select: { id: true, nom: true, niveau: true } },
          soumisPar: {
            select: { id: true, username: true, prenom: true, nom: true },
          },
        },
      });

      return {
        total: rapports.length,
        rapports,
      };
    }

    // 3. Pour les autres rôles : il faut un territoire associé
    const utilisateur = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { territoire: true },
    });

    if (!utilisateur?.territoire) {
      throw new ForbiddenException('Aucun territoire associé à votre compte.');
    }

    // Récupérer tous les territoires sous celui de l'utilisateur
    const territoireIds = await this.getEnfantsTerritoires(
      utilisateur.territoire.id,
    );

    // Récupérer les rapports SOUMIS dans ce périmètre
    const rapports = await this.prisma.rapport.findMany({
      where: {
        statut: StatutRapport.SOUMIS,
        territoireId: { in: territoireIds },
      },
      orderBy: { dateSoumission: 'asc' },
      include: {
        assemblee: { select: { id: true, nom: true } },
        territoire: { select: { id: true, nom: true, niveau: true } },
        soumisPar: {
          select: { id: true, username: true, prenom: true, nom: true },
        },
      },
    });

    // Filtrer pour ne garder que ceux que l'utilisateur peut VRAIMENT valider
    const niveauValidation = await this.getNiveauValidation(user.role);
    const rapportsFiltrés: any[] = [];
    for (const rapport of rapports) {
      const peutValider = await this.verifierPeutValiderRapport(
        rapport,
        utilisateur.territoire.id,
        niveauValidation!,
      );
      if (peutValider) {
        rapportsFiltrés.push(rapport);
      }
    }

    return {
      total: rapportsFiltrés.length,
      rapports: rapportsFiltrés,
    };
  }

  async getStats(user: any) {
    const fileAttente = await this.getFileAttente(user);

    // Stats par statut global dans le périmètre
    const utilisateur = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { territoire: true },
    });

    let where: any = {};

    if (user.role !== UserRole.ADMIN_SYSTEME && utilisateur?.territoire) {
      const territoireIds = await this.getEnfantsTerritoires(
        utilisateur.territoire.id,
      );
      where.territoireId = { in: territoireIds };
    }

    const [brouillon, soumis, valide, rejete] = await Promise.all([
      this.prisma.rapport.count({
        where: { ...where, statut: StatutRapport.BROUILLON },
      }),
      this.prisma.rapport.count({
        where: { ...where, statut: StatutRapport.SOUMIS },
      }),
      this.prisma.rapport.count({
        where: { ...where, statut: StatutRapport.VALIDE },
      }),
      this.prisma.rapport.count({
        where: { ...where, statut: StatutRapport.REJETE },
      }),
    ]);

    return {
      fileAttente: fileAttente.total,
      parStatut: { brouillon, soumis, valide, rejete },
      total: brouillon + soumis + valide + rejete,
    };
  }

  // ==================== HELPERS ====================

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

  private async verifierPeutValiderRapport(
    rapport: any,
    territoireUserId: string,
    niveauValidation: NiveauTerritoire,
  ): Promise<boolean> {
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

    return territoireValidation.id === territoireUserId;
  }
}
