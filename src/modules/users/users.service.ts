import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: FilterUserDto) {
    const { search, role, isActive, page = 1, limit = 20 } = filter;
    // Conversion explicite en nombre pour éviter les erreurs Prisma
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { dateJoined: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          prenom: true,
          nom: true,
          contact: true,
          isActive: true,
          mustChangePassword: true,
          dateJoined: true,
          lastLogin: true,
          territoireId: true,
          territoire: { select: { id: true, nom: true, niveau: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        prenom: true,
        nom: true,
        contact: true,
        photo: true,
        isActive: true,
        mustChangePassword: true,
        dateJoined: true,
        lastLogin: true,
        territoireId: true,
        territoire: { select: { id: true, nom: true, niveau: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      },
    });

    if (existing) {
      throw new ConflictException("Nom d'utilisateur ou email déjà utilisé");
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        mustChangePassword: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        prenom: true,
        nom: true,
        contact: true,
        isActive: true,
        mustChangePassword: true,
        dateJoined: true,
        territoireId: true,
      },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const data: any = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
      data.mustChangePassword = true;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        prenom: true,
        nom: true,
        contact: true,
        isActive: true,
        mustChangePassword: true,
        dateJoined: true,
        lastLogin: true,
        territoireId: true,
      },
    });

    return updated;
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas supprimer votre propre compte',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Protection : empêcher la suppression du dernier admin
    if (user.role === UserRole.ADMIN_SYSTEME) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN_SYSTEME, isActive: true },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Impossible de supprimer le dernier administrateur actif',
        );
      }
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: 'Utilisateur supprimé avec succès' };
  }

  async toggleActive(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas désactiver votre propre compte',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Protection : empêcher la désactivation du dernier admin
    if (user.role === UserRole.ADMIN_SYSTEME && user.isActive) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN_SYSTEME, isActive: true },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Impossible de désactiver le dernier administrateur actif',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true,
        role: true,
      },
    });

    return {
      message: `Utilisateur ${updated.isActive ? 'activé' : 'désactivé'} avec succès`,
      user: updated,
    };
  }
}
