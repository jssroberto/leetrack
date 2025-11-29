import { Difficulty } from '@leetrack/database';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';

@Injectable()
export class ProblemsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.problem.findMany({
      orderBy: {
        leetcodeId: 'asc', // Ordenar por el ID oficial de LeetCode (1, 2, 3...)
      },
    });
  }

  async upsertProblem(data: CreateProblemDto) {
    const { leetcodeId, slug, title, difficulty, tags } = data;

    // Map string difficulty to Enum if necessary, though DTO validation should handle it
    const difficultyEnum = difficulty as Difficulty;

    return this.prisma.problem.upsert({
      where: { leetcodeId },
      update: {
        // Only update basic fields that may have changed
        // DO NOT update NeetCode fields (isNeetCode150, isBlind75, isPremium, neetCodeCategory)
        // as they are seeded from our curated list and should not be overwritten
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
        // New problems default to false for NeetCode fields
        // (will be explicit in DB due to schema defaults)
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.problem.findUnique({ where: { id } });
  }

  async findAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
