import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    console.log('🌱 Vérification et exécution du seed automatique...');

    // 1. Création des fonctions (si elles n'existent pas)
    const fonctions = [
      'Membre simple',
      'Secrétaire',
      'Dirigeant',
      'Semeur',
      'RTVC',
      'Accueil et Installation',
    ];

    for (const nom of fonctions) {
      await this.prisma.fonction.upsert({
        where: { nom },
        update: {},
        create: { nom },
      });
    }
    console.log('✅ Fonctions initialisées.');

    // 2. Création de l'admin (si inexistant)
    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: UserRole.ADMIN_SYSTEME },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('azerty', 10);
      await this.prisma.user.create({
        data: {
          username: 'elie',
          email: 'leboueelie@gmail.com',
          password: hashedPassword,
          role: UserRole.ADMIN_SYSTEME,
          prenom: 'Admin',
          nom: 'Système',
          contact: '+225 0000000000',
          isActive: true,
          mustChangePassword: true,
        },
      });
      console.log('🎉 Admin initial créé.');
    } else {
      console.log('✅ Un administrateur système existe déjà.');
    }
  }
}
