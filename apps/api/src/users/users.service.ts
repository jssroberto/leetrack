import type { User } from '@leetrack/database';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SafeUser = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface ActiveChallengeProblem {
  id: string;
  leetcodeId: number;
  slug: string;
  title: string;
  difficulty: string;
  challengeId: string;
  groupId: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });
    return user;
  }

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getActiveChallengeProblems(userId: string): Promise<ActiveChallengeProblem[]> {
    const now = new Date();

    // 1. Get user's groups
    const userGroups = await this.prisma.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });

    const groupIds = userGroups.map((ug) => ug.groupId);

    if (groupIds.length === 0) {
      return [];
    }

    // 2. Get active challenges in those groups
    const challenges = await this.prisma.challenge.findMany({
      where: {
        groupId: { in: groupIds },
        OR: [{ dueDate: null }, { dueDate: { gt: now } }],
      },
      select: { id: true, groupId: true },
    });

    const challengeIds = challenges.map((c) => c.id);

    if (challengeIds.length === 0) {
      return [];
    }

    // 3. Get problems for these challenges
    const challengeProblems = await this.prisma.challengeProblem.findMany({
      where: {
        challengeId: { in: challengeIds },
      },
      include: {
        problem: {
          select: {
            id: true,
            leetcodeId: true,
            slug: true,
            title: true,
            difficulty: true,
          },
        },
        challenge: {
          select: {
            id: true,
            groupId: true,
          },
        },
      },
    });

    // 4. Deduplicate problems (a problem might be in multiple challenges)
    const uniqueProblems = new Map<string, ActiveChallengeProblem>();

    for (const cp of challengeProblems) {
      if (!uniqueProblems.has(cp.problem.id)) {
        uniqueProblems.set(cp.problem.id, {
          ...cp.problem,
          challengeId: cp.challenge.id,
          groupId: cp.challenge.groupId,
        });
      }
    }

    return Array.from(uniqueProblems.values());
  }
}
