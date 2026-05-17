import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // 1. Création des fonctions de membre (si elles n'existent pas)
  const fonctions = [
    'Membre simple',
    'Secrétaire',
    'Dirigeant',
    'Semeur',
    'RTVC',
    'Accueil et Installation',
  ];

  for (const nom of fonctions) {
    await prisma.fonction.upsert({
      where: { nom },
      update: {},
      create: { nom },
    });
  }
  console.log('✅ Fonctions initialisées.');

  // 2. Création de l'admin (si non existant)
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN_SYSTEME },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('AdminParDefaut123!', 10);
    const admin = await prisma.user.create({
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
    console.log(`🎉 Admin initial créé : ${admin.username}`);
  } else {
    console.log('✅ Un administrateur système existe déjà.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Déconnexion Prisma.');
  });
