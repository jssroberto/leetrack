import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProblemsService } from '../problems/problems.service';
import { UsersService } from '../users/users.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private problemsService: ProblemsService,
    private usersService: UsersService,
  ) {}

  async create(createSubmissionDto: CreateSubmissionDto, userId: string) {
    const { problem: problemData, lang, confidenceLevel } = createSubmissionDto;

    // 1. Upsert the problem (Lazy Loading)
    const problem = await this.problemsService.upsertProblem(problemData);

    // 2. Create the submission
    const submission = await this.prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        lang,
        confidenceLevel,
      },
    });

    // 3. Update challenge progress (async, don't block submission response)
    this.updateChallengeProgress(userId, problem.id).catch((error) => {
      console.error('Failed to update challenge progress:', error);
    });

    return submission;
  }

  /**
   * Update challenge progress for a user when they solve a problem.
   * This runs async and doesn't block the submission creation.
   */
  private async updateChallengeProgress(userId: string, problemId: string): Promise<void> {
    // Find all challenges this user is part of that contain this problem
    const challengeProblems = await this.prisma.challengeProblem.findMany({
      where: {
        problemId,
        challenge: {
          group: {
            members: {
              some: { userId },
            },
          },
        },
      },
      select: {
        challengeId: true,
      },
    });

    // Upsert progress for each challenge
    await Promise.all(
      challengeProblems.map((cp) =>
        this.prisma.challengeProgress.upsert({
          where: {
            userId_challengeId_problemId: {
              userId,
              challengeId: cp.challengeId,
              problemId,
            },
          },
          create: {
            userId,
            challengeId: cp.challengeId,
            problemId,
            attempts: 1,
            firstSolvedAt: new Date(),
            lastAttemptAt: new Date(),
          },
          update: {
            attempts: { increment: 1 },
            lastAttemptAt: new Date(),
          },
        }),
      ),
    );
  }

  async findAll(userId: string) {
    return this.prisma.submission.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findByGroup(groupId: string) {
    return this.prisma.submission.findMany({
      where: {
        user: {
          groups: {
            some: {
              groupId: groupId,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            leetcodeUsername: true,
            email: true,
          },
        },
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            leetcodeId: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }
}
