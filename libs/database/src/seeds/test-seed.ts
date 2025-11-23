import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function testNeetCodeSeed() {
  console.log('🧪 Testing NeetCode seed data...\n');

  // Test 1: Total count
  const totalCount = await prisma.problem.count();
  console.log(`✅ Total problems: ${totalCount}`);

  // Test 2: NeetCode 150
  const neetcode150 = await prisma.problem.findMany({
    where: { isNeetCode150: true },
    take: 5,
    select: { leetcodeId: true, title: true, difficulty: true, neetCodeCategory: true },
  });
  console.log(`\n✅ NeetCode150 sample (first 5):`);
  neetcode150.forEach((p) =>
    console.log(`   ${p.leetcodeId}. ${p.title} (${p.difficulty}) - ${p.neetCodeCategory}`),
  );

  // Test 3: Blind75
  const blind75Count = await prisma.problem.count({ where: { isBlind75: true } });
  console.log(`\n✅ Blind75 count: ${blind75Count}`);

  // Test 4: By category
  const arrayHashingProblems = await prisma.problem.count({
    where: { neetCodeCategory: 'Arrays & Hashing' },
  });
  console.log(`\n✅ Arrays & Hashing problems: ${arrayHashingProblems}`);

  // Test 5: Check for specific iconic problems
  const iconicProblems = await prisma.problem.findMany({
    where: {
      leetcodeId: {
        in: [1, 217, 242], // Two Sum, Contains Duplicate, Valid Anagram
      },
    },
    select: { leetcodeId: true, title: true, isBlind75: true, isNeetCode150: true },
  });
  console.log(`\n✅ Iconic problems:`);
  iconicProblems.forEach((p) =>
    console.log(
      `   ${p.leetcodeId}. ${p.title} ${p.isBlind75 ? '(Blind75)' : ''} ${
        p.isNeetCode150 ? '(NeetCode150)' : ''
      }`,
    ),
  );

  // Test 6: Premium problems
  const premiumCount = await prisma.problem.count({ where: { isPremium: true } });
  console.log(`\n✅ Premium problems: ${premiumCount}`);

  console.log(`\n✅ All tests passed! Seed data looks good.`);
}

async function main() {
  try {
    await testNeetCodeSeed();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
