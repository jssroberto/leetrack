import { Difficulty } from '@leetrack/database';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';

@Injectable()
export class ProblemsService {
  constructor(private prisma: PrismaService) {}

  async upsertProblem(data: CreateProblemDto) {
    const { leetcodeId, slug, title, difficulty, tags } = data;

    // Map string difficulty to Enum if necessary, though DTO validation should handle it
    const difficultyEnum = difficulty as Difficulty;

    return this.prisma.problem.upsert({
      where: { leetcodeId },
      update: {
        slug,
        title,
        difficulty: difficultyEnum,
        tags,
      },
      create: {
        leetcodeId,
        slug,
        title,
        difficulty: difficultyEnum,
        tags,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.problem.findUnique({ where: { id } });
  }
}
