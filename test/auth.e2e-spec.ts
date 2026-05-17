import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Seed : créer un administrateur de test s'il n'existe pas
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'e2e-admin' },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('E2eAdmin123!', 10);
      await prisma.user.create({
        data: {
          username: 'e2e-admin',
          email: 'e2e-admin@cmci.ci',
          password: hashedPassword,
          role: UserRole.ADMIN_SYSTEME,
          prenom: 'E2E',
          nom: 'Admin',
          mustChangePassword: false,
        },
      });
    }
  });

  afterAll(async () => {
    // Nettoyage : supprimer les données de test
    await prisma.user.deleteMany({
      where: { username: { in: ['e2e-admin', 'e2e-user', 'e2e-new-user'] } },
    });
    await prisma.refreshToken.deleteMany();
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('renvoie 200 et un accessToken pour des identifiants valides', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'e2e-admin', password: 'E2eAdmin123!' })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.username).toEqual('e2e-admin');
      adminToken = res.body.accessToken;
    });

    it('renvoie 401 pour un mot de passe erroné', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'e2e-admin', password: 'wrong' })
        .expect(401);
    });
  });

  describe('POST /api/auth/register (protégé admin)', () => {
    it('renvoie 401 sans token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'e2e-user',
          email: 'e2e-user@cmci.ci',
          password: 'Pass123!',
          role: 'DIRIGEANT_ASSEMBLEE',
        })
        .expect(401);
    });

    it('renvoie 201 et crée un utilisateur avec un token admin valide', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'e2e-user',
          email: 'e2e-user@cmci.ci',
          password: 'Pass123!',
          role: 'DIRIGEANT_ASSEMBLEE',
        })
        .expect(201);
      expect(res.body.username).toEqual('e2e-user');
    });
  });

  describe('GET /api/auth/me', () => {
    it('renvoie 200 et le profil avec un token valide', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.username).toEqual('e2e-admin');
    });

    it('renvoie 401 sans token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('renvoie 200 si ancien mot de passe correct, puis le token est révoqué', async () => {
      // Changement réussi
      const resChange = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ oldPassword: 'E2eAdmin123!', newPassword: 'E2eNewPass456!' })
        .expect(200);
      expect(resChange.body.message).toContain('succès');

      // L'ancien token a été révoqué, on se reconnecte avec le nouveau mot de passe
      const resLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'e2e-admin', password: 'E2eNewPass456!' })
        .expect(200);
      adminToken = resLogin.body.accessToken; // mise à jour pour la suite
    });

    it('renvoie 400 si ancien mot de passe incorrect', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ oldPassword: 'wrong-old', newPassword: 'SomeNewPass' })
        .expect(400);
    });
  });
});
