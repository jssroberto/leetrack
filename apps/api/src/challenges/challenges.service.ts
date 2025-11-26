import { Role } from '@leetrack/database';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';

export interface UserProgressData {
  user: { id: string; email: string };
  problemsCompleted: number;
  totalAttempts: number;
  problems: Array<{
    problemId: string;
    attempts: number;
    firstSolvedAt: Date;
  }>;
}

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService) {}

  async create(groupId: string, dto: CreateChallengeDto, userId: string) {
    // Verify user is admin of the group
    await this.verifyGroupAdmin(groupId, userId);

    // Create challenge with problems in a transaction
    return this.prisma.$transaction(async (tx) => {
      const challenge = await tx.challenge.create({
        data: {
          groupId,
          name: dto.name,
          description: dto.description,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          createdById: userId,
        },
      });

      // Add problems to challenge
      await Promise.all(
        dto.problemIds.map((problemId, index) =>
          tx.challengeProblem.create({
            data: {
              challengeId: challenge.id,
              problemId,
              order: index,
            },
          }),
        ),
      );

      return challenge;
    });
  }

  async findAll(groupId: string, userId: string) {
    // Verify user is member of the group
    await this.verifyGroupMember(groupId, userId);

    const challenges = await this.prisma.challenge.findMany({
      where: { groupId },
      include: {
        _count: {
          select: { problems: true },
        },
        createdBy: {
          select: { id: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each challenge, calculate user's progress
    const challengesWithProgress = await Promise.all(
      challenges.map(async (challenge) => {
        const totalProblems = challenge._count.problems;
        const completedCount = await this.prisma.challengeProgress.count({
          where: {
            challengeId: challenge.id,
            userId,
          },
        });

        return {
          ...challenge,
          myProgress: {
            completed: completedCount,
            total: totalProblems,
          },
        };
      }),
    );

    return challengesWithProgress;
  }

  async findOne(groupId: string, challengeId: string, userId: string) {
    // Verify user is member of the group
    await this.verifyGroupMember(groupId, userId);

    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId, groupId },
      include: {
        problems: {
          include: {
            problem: true,
          },
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { id: true, email: true },
        },
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Get all progress for this challenge (for leaderboard)
    const allProgress = await this.prisma.challengeProgress.findMany({
      where: { challengeId },
      include: {
        user: {
          select: { id: true, email: true },
        },
        problem: {
          select: { id: true, title: true, difficulty: true },
        },
      },
    });

    // Build leaderboard
    const userProgressMap = new Map<string, UserProgressData>();

    for (const progress of allProgress) {
      const key = progress.userId;
      if (!userProgressMap.has(key)) {
        userProgressMap.set(key, {
          user: progress.user,
          problemsCompleted: 0,
          totalAttempts: 0,
          problems: [],
        });
      }

      const userProgress = userProgressMap.get(key)!;
      userProgress.problemsCompleted += 1;
      userProgress.totalAttempts += progress.attempts;
      userProgress.problems.push({
        problemId: progress.problemId,
        attempts: progress.attempts,
        firstSolvedAt: progress.firstSolvedAt,
      });
    }

    const leaderboard = Array.from(userProgressMap.values()).sort(
      (a, b) => b.problemsCompleted - a.problemsCompleted,
    );

    // Add user's completion status to each problem
    const userProgress = new Set(
      allProgress.filter((p) => p.userId === userId).map((p) => p.problemId),
    );

    const problemsWithStatus = challenge.problems.map((cp) => ({
      ...cp.problem,
      order: cp.order,
      completed: userProgress.has(cp.problemId),
    }));

    return {
      ...challenge,
      problems: problemsWithStatus,
      leaderboard,
    };
  }

  async update(groupId: string, challengeId: string, dto: CreateChallengeDto, userId: string) {
    // Verify user is admin of the group
    await this.verifyGroupAdmin(groupId, userId);

    // Update in transaction
    return this.prisma.$transaction(async (tx) => {
      // Update challenge
      const challenge = await tx.challenge.update({
        where: { id: challengeId, groupId },
        data: {
          name: dto.name,
          description: dto.description,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        },
      });

      // Delete old problems
      await tx.challengeProblem.deleteMany({
        where: { challengeId },
      });

      // Add new problems
      await Promise.all(
        dto.problemIds.map((problemId, index) =>
          tx.challengeProblem.create({
            data: {
              challengeId,
              problemId,
              order: index,
            },
          }),
        ),
      );

      return challenge;
    });
  }

  async delete(groupId: string, challengeId: string, userId: string) {
    // Verify user is admin of the group
    await this.verifyGroupAdmin(groupId, userId);

    await this.prisma.challenge.delete({
      where: { id: challengeId, groupId },
    });
  }

  // Helper methods
  private async verifyGroupMember(groupId: string, userId: string) {
    const membership = await this.prisma.userGroup.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
  }

  private async verifyGroupAdmin(groupId: string, userId: string) {
    const membership = await this.prisma.userGroup.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!membership || membership.role !== Role.ADMIN) {
      throw new ForbiddenException('Only group admins can perform this action');
    }
  }

  async createProposal(groupId: string, dto: CreateProposalDto, userId: string) {
    // Verify user is member of the group
    await this.verifyGroupMember(groupId, userId);

    const targetDate = new Date(dto.targetDate);

    // Simple validation: target date must be in the future
    if (targetDate < new Date()) {
      throw new BadRequestException('Target date must be in the future');
    }

    return this.prisma.challengeProposal.create({
      data: {
        groupId,
        createdById: userId,
        title: dto.title,
        description: dto.description,
        targetDate,
      },
    });
  }

  async findAllProposals(groupId: string, userId: string) {
    // Verify user is member
    await this.verifyGroupMember(groupId, userId);

    const proposals = await this.prisma.challengeProposal.findMany({
      where: { groupId },
      include: {
        _count: {
          select: { votes: true },
        },
        votes: {
          where: { userId },
          select: { id: true },
        },
        createdBy: {
          select: { id: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return proposals.map((p) => ({
      ...p,
      voteCount: p._count.votes,
      hasVoted: p.votes.length > 0,
      votes: undefined, // Remove raw votes array
      _count: undefined, // Remove count object
    }));
  }

  async toggleVote(groupId: string, proposalId: string, userId: string) {
    // Verify user is member
    await this.verifyGroupMember(groupId, userId);

    // Check if proposal exists and belongs to group
    const proposal = await this.prisma.challengeProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal || proposal.groupId !== groupId) {
      throw new NotFoundException('Proposal not found');
    }

    // Check if vote exists
    const existingVote = await this.prisma.proposalVote.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
          userId,
        },
      },
    });

    if (existingVote) {
      // Remove vote
      await this.prisma.proposalVote.delete({
        where: { id: existingVote.id },
      });
      return { voted: false };
    } else {
      // Add vote
      await this.prisma.proposalVote.create({
        data: {
          proposalId,
          userId,
        },
      });
      return { voted: true };
    }
  }
}
