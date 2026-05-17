import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, TokenPayload } from './auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-id-1',
    username: 'admin',
    email: 'admin@cmci.ci',
    password: bcrypt.hashSync('Admin123!', 10),
    role: UserRole.ADMIN_SYSTEME,
    prenom: 'Admin',
    nom: 'Système',
    isActive: true,
    mustChangePassword: false,
    dateJoined: new Date(),
    lastLogin: null,
    territoireId: null,
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('devrait retourner les jetons et le profil si les identifiants sont valides', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);

      const result = await service.login({
        username: 'admin',
        password: 'Admin123!',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.username).toEqual('admin');
    });

    it('devrait lever une exception si l’utilisateur n’existe pas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ username: 'inconnu', password: 'test' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('devrait lever une exception si le compte est désactivé', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      await expect(
        service.login({ username: 'admin', password: 'Admin123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('devrait lever une exception si le mot de passe est invalide', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);
      await expect(
        service.login({ username: 'admin', password: 'mauvais' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('devrait créer un nouvel utilisateur', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await service.register({
        username: 'admin2',
        email: 'admin2@cmci.ci',
        password: 'Admin123!',
        role: UserRole.ADMIN_SYSTEME,
      });

      expect(result).not.toHaveProperty('password');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('devrait lever une exception si le nom d’utilisateur ou l’email existe déjà', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      await expect(
        service.register({
          username: 'admin',
          email: 'admin@cmci.ci',
          password: 'Admin123!',
          role: UserRole.ADMIN_SYSTEME,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    it('devrait changer le mot de passe si l’ancien est correct', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);

      const result = await service.changePassword('user-id-1', {
        oldPassword: 'Admin123!',
        newPassword: 'NewPass123!',
      });

      expect(result.message).toContain('succès');
    });

    it('devrait lever une exception si l’ancien mot de passe est incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

      await expect(
        service.changePassword('user-id-1', {
          oldPassword: 'mauvais',
          newPassword: 'NewPass123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
