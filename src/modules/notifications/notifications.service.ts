import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, unreadOnly?: boolean) {
    const where: any = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      notifications,
      unreadCount,
      total: notifications.length,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'Toutes les notifications marquées comme lues' };
  }

  // ============================================================
  // CRÉATION DE NOTIFICATIONS
  // ============================================================

  async createNotification(data: {
    userId: string;
    titre: string;
    message: string;
    lien?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        titre: data.titre,
        message: data.message,
        lien: data.lien,
        isRead: false,
      },
    });
  }

  async notifierSoumissionRapport(rapport: any) {
    const territoire = await this.prisma.territoire.findUnique({
      where: { id: rapport.territoireId },
      include: { parent: true },
    });

    if (!territoire?.parent) return;

    const dirigeants = await this.prisma.user.findMany({
      where: {
        territoireId: territoire.parent.id,
        isActive: true,
      },
    });

    for (const dirigeant of dirigeants) {
      await this.createNotification({
        userId: dirigeant.id,
        titre: 'Nouveau rapport à valider',
        message: `Un rapport de ${rapport.periode} a été soumis par ${rapport.soumisPar?.username || 'un dirigeant'}.`,
        lien: `/rapports/${rapport.id}`,
      });
    }
  }

  async notifierValidationRapport(rapport: any, validePar: any) {
    await this.createNotification({
      userId: rapport.soumisParId,
      titre: 'Rapport validé',
      message: `Votre rapport de ${rapport.periode} a été validé par ${validePar.prenom || ''} ${validePar.nom || validePar.username}.`,
      lien: `/rapports/${rapport.id}`,
    });
  }

  async notifierRejetRapport(
    rapport: any,
    rejetePar: any,
    commentaire: string,
  ) {
    await this.createNotification({
      userId: rapport.soumisParId,
      titre: 'Rapport rejeté',
      message: `Votre rapport de ${rapport.periode} a été rejeté. Motif : ${commentaire}`,
      lien: `/rapports/${rapport.id}`,
    });
  }
}
