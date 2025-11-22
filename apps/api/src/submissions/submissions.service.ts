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
    const { problem: problemData, lang } = createSubmissionDto;

    // 1. Upsert the problem (Lazy Loading)
    const problem = await this.problemsService.upsertProblem(problemData);

    // 2. Create the submission
    return this.prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        lang,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.submission.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
