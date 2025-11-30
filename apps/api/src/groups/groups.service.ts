import { Role } from '@leetrack/database';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  // 1. CREATE: Optimizado con "Nested Write"
  // Crea el grupo y asigna al creador como ADMIN en una sola operación atómica.
  // Además, devuelve la estructura completa con los miembros.
  async create(createGroupDto: CreateGroupDto, userId: string) {
    return this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        // Aquí ocurre la magia de la relación:
        members: {
          create: {
            userId: userId,
            role: Role.ADMIN, // El creador es Admin automáticamente
          },
        },
      },
      // Importante: Incluimos los miembros en la respuesta para el Frontend
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                leetcodeUsername: true,
                // NO incluimos passwordHash por seguridad
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
        // Opcional: Si quieres ver tu propio rol en la lista de grupos
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: {
            role: 'asc', // Mostrar admins primero (ADMIN < MEMBER alfabéticamente? No, depende del Enum, mejor ordenar por fecha o lógica manual)
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                leetcodeUsername: true,
              },
            },
          },
        },
        // Aquí puedes incluir otras relaciones si las necesitas en el futuro
        // challenges: true,
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  // 2. JOIN: Optimizado para devolver el grupo actualizado
  async join(inviteCode: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode },
    });

    if (!group) {
      throw new NotFoundException('Invalid invite code');
    }

    // Verificar si ya es miembro
    const existingMember = await this.prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: group.id,
        },
      },
    });

    if (existingMember) {
      // Si ya es miembro, devolvemos el grupo (y podrías lanzar una excepción si prefieres)
      return this.findOne(group.id);
    }

    // Crear la relación
    await this.prisma.userGroup.create({
      data: {
        userId,
        groupId: group.id,
        role: Role.MEMBER,
      },
    });

    // IMPORTANTE: Devolver el grupo con la información actualizada
    // Llamamos a findOne para que nos traiga la estructura completa con el nuevo miembro
    return this.findOne(group.id);
  }

  async leaveGroup(groupId: string, userId: string) {
    // Validar existencia primero
    const userGroup = await this.prisma.userGroup.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!userGroup) {
      throw new NotFoundException('You are not a member of this group');
    }

    // Admin no puede salirse si es el único (lógica opcional pero recomendada)
    // ...

    return this.prisma.userGroup.delete({
      where: {
        userId_groupId: { userId, groupId },
      },
    });
  }

  async kickMember(groupId: string, adminId: string, targetUserId: string) {
    // 1. Verificar Admin
    const adminMember = await this.prisma.userGroup.findUnique({
      where: { userId_groupId: { userId: adminId, groupId } },
    });

    if (!adminMember || adminMember.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can kick members');
    }

    // 2. Verificar Objetivo
    const targetMember = await this.prisma.userGroup.findUnique({
      where: { userId_groupId: { userId: targetUserId, groupId } },
    });

    if (!targetMember) {
      throw new NotFoundException('User is not in this group');
    }

    // 3. Protecciones
    if (adminId === targetUserId) {
      throw new BadRequestException('You cannot kick yourself.');
    }
    if (targetMember.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot kick another admin');
    }

    // Eliminar relación
    return this.prisma.userGroup.delete({
      where: {
        userId_groupId: { userId: targetUserId, groupId },
      },
    });
  }
}
