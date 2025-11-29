import { Difficulty, PrismaClient } from '../generated/prisma';
import neetcodeData from './neetcode250.json';

const prisma = new PrismaClient();

interface SeedProblem {
  leetcodeId: number;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  isNeetCode150: boolean;
  isBlind75: boolean;
  isPremium: boolean;
}

async function seedNeetCodeProblems() {
  console.log('🌱 Seeding NeetCode problems...\n');

  const problems = neetcodeData.problems as SeedProblem[];

  // 1. Extract and seed categories
  console.log('📦 Seeding Categories...');
  const uniqueCategories = [...new Set(problems.map((p) => p.category))].filter(Boolean);
  const categoryMap = new Map<string, string>(); // Name -> ID

  for (const categoryName of uniqueCategories) {
    const slug = categoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const category = await prisma.category.upsert({
      where: { name: categoryName },
      create: {
        name: categoryName,
        slug,
      },
      update: {},
    });
    categoryMap.set(categoryName, category.id);
  }
  console.log(`   Processed ${uniqueCategories.length} categories\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const problem of problems) {
    try {
      const categoryId = problem.category ? categoryMap.get(problem.category) : null;

      const result = await prisma.problem.upsert({
        where: { leetcodeId: problem.leetcodeId },
        create: {
          leetcodeId: problem.leetcodeId,
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty as Difficulty,
          tags: [], // Can be populated later if needed
          isPremium: problem.isPremium,
          isNeetCode150: problem.isNeetCode150,
          isBlind75: problem.isBlind75,
          categoryId,
        },
        update: {
          title: problem.title,
          difficulty: problem.difficulty as Difficulty,
          isPremium: problem.isPremium,
          isNeetCode150: problem.isNeetCode150,
          isBlind75: problem.isBlind75,
          categoryId,
        },
      });

      // Check if it was created or updated by comparing createdAt and updatedAt
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created++;
      } else {
        updated++;
      }
    } catch (error) {
      console.error(`❌ Error seeding problem ${problem.leetcodeId} (${problem.title}):`, error);
      skipped++;
    }
  }

  console.log(`\n✅ Seed completed:`);
  console.log(`   Created: ${created} problems`);
  console.log(`   Updated: ${updated} problems`);
  console.log(`   Skipped: ${skipped} problems`);
  console.log(`   Total: ${problems.length} problems\n`);

  // Print statistics
  const stats = await prisma.problem.groupBy({
    by: ['difficulty'],
    _count: true,
  });

  console.log('📊 Problems by difficulty:');
  for (const stat of stats) {
    console.log(`   ${stat.difficulty}: ${stat._count} problems`);
  }

  const neetcode150Count = await prisma.problem.count({
    where: { isNeetCode150: true },
  });

  const blind75Count = await prisma.problem.count({
    where: { isBlind75: true },
  });

  console.log(`\n📚 Special lists:`);
  console.log(`   NeetCode150: ${neetcode150Count} problems`);
  console.log(`   Blind75: ${blind75Count} problems`);
}

async function main() {
  try {
    await seedNeetCodeProblems();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
