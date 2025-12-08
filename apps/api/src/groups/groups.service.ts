import { Role } from '@leetrack/database';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(createGroupDto: CreateGroupDto, userId: string) {
    const existingGroup = await this.prisma.group.findFirst({
      where: {
        name: createGroupDto.name,
        members: {
          some: {
            userId,
            role: Role.ADMIN,
          },
        },
      },
    });

    if (existingGroup) {
      throw new BadRequestException('You already have a group with this name');
    }

    const inviteCode = await this.generateUniqueInviteCode();

    return this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        inviteCode,
        members: {
          create: {
            userId: userId,
            role: Role.ADMIN,
          },
        },
      },
      include: {
        members: {
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
      },
    });
  }

  // === Método UPDATE agregado ===
  async update(groupId: string, userId: string, updateGroupDto: UpdateGroupDto) {
    // 1. Verificar Permisos: ¿Es el usuario ADMIN de este grupo?
    const userGroup = await this.prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!userGroup || userGroup.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can update group settings');
    }

    // 2. Validación Extra: Si cambia el inviteCode, verificar que no esté duplicado
    if (updateGroupDto.inviteCode) {
      const existing = await this.prisma.group.findUnique({
        where: { inviteCode: updateGroupDto.inviteCode },
      });
      // Si existe y NO es el mismo grupo (es decir, alguien más ya lo tiene)
      if (existing && existing.id !== groupId) {
        throw new BadRequestException('This invite code is already taken');
      }
    }

    // 3. Actualizar
    return this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: updateGroupDto.name,
        inviteCode: updateGroupDto.inviteCode,
        weeklyLeetcodes: updateGroupDto.weeklyLeetcodes,
      },
      // Incluimos miembros para mantener la consistencia del objeto en el frontend
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, leetcodeUsername: true },
            },
          },
        },
      },
    });
  }

  private async generateUniqueInviteCode(): Promise<string> {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
      const part1 = this.generateRandomString(4);
      const part2 = this.generateRandomString(4);
      const code = `${part1}-${part2}`;

      const existing = await this.prisma.group.findUnique({
        where: { inviteCode: code },
      });

      if (!existing) {
        return code;
      }
      retries++;
    }
    throw new BadRequestException('Failed to generate a unique invite code. Please try again.');
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
            role: 'asc', // Mostrar admins primero
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
      // Si ya es miembro, devolvemos el grupo
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