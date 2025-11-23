#!/usr/bin/env tsx

/**
 * Script to fetch NeetCode problems data and generate seed file
 * for Leetrack database.
 *
 * Data source: https://github.com/neetcode-gh/leetcode
 */

interface NeetCodeProblem {
  neetcode150?: boolean;
  blind75?: boolean;
  problem: string;
  pattern: string;
  link: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  code: string; // Format: "0001-two-sum"
  premium?: boolean;
}

interface ProcessedProblem {
  leetcodeId: number;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  isNeetCode150: boolean;
  isBlind75: boolean;
  isPremium: boolean;
}

async function fetchNeetCodeData(): Promise<NeetCodeProblem[]> {
  const url = 'https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json';

  console.log('Fetching NeetCode problem data...');
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  const data = (await response.json()) as NeetCodeProblem[];
  console.log(`✅ Fetched ${data.length} problems`);

  return data;
}

function extractLeetCodeId(code: string): number {
  // Format: "0001 -two-sum" → 1
  const match = code.match(/^(\d+)-/);
  if (!match) {
    throw new Error(`Invalid code format: ${code}`);
  }
  return parseInt(match[1], 10);
}

function extractSlug(code: string): string {
  // Format: "0001-two-sum" → "two-sum"
  const match = code.match(/^\d+-(.*)/);
  if (!match) {
    throw new Error(`Invalid code format: ${code}`);
  }
  return match[1];
}

function normalizeDifficulty(difficulty: string): 'EASY' | 'MEDIUM' | 'HARD' {
  const upper = difficulty.toUpperCase();
  if (upper === 'EASY' || upper === 'MEDIUM' || upper === 'HARD') {
    return upper as 'EASY' | 'MEDIUM' | 'HARD';
  }
  throw new Error(`Invalid difficulty: ${difficulty}`);
}

function processProblems(data: NeetCodeProblem[]): ProcessedProblem[] {
  const processed: ProcessedProblem[] = [];
  const seen = new Set<number>();

  for (const problem of data) {
    const leetcodeId = extractLeetCodeId(problem.code);

    // Skip duplicates
    if (seen.has(leetcodeId)) {
      console.warn(`⚠️  Duplicate problem ID ${leetcodeId}: ${problem.problem}`);
      continue;
    }
    seen.add(leetcodeId);

    processed.push({
      leetcodeId,
      slug: extractSlug(problem.code),
      title: problem.problem,
      difficulty: normalizeDifficulty(problem.difficulty),
      category: problem.pattern,
      isNeetCode150: problem.neetcode150 === true,
      isBlind75: problem.blind75 === true,
      isPremium: problem.premium === true,
    });
  }

  return processed;
}

async function main() {
  try {
    // Fetch data
    const neetcodeData = await fetchNeetCodeData();

    // Process
    const problems = processProblems(neetcodeData);

    // Statistics
    const neetcode250Count = problems.length;
    const neetcode150Count = problems.filter((p) => p.isNeetCode150).length;
    const blind75Count = problems.filter((p) => p.isBlind75).length;

    console.log(`\n📊 Statistics:`);
    console.log(`   Total problems: ${neetcode250Count}`);
    console.log(`   NeetCode150: ${neetcode150Count}`);
    console.log(`   Blind75: ${blind75Count}`);
    console.log(`   Premium: ${problems.filter((p) => p.isPremium).length}`);

    // Group by category
    const byCategory = problems.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {} as Record<string, ProcessedProblem[]>);

    console.log(`\n📁 Categories (${Object.keys(byCategory).length}):`);
    for (const [category, probs] of Object.entries(byCategory)) {
      console.log(`   ${category}: ${probs.length} problems`);
    }

    // Write to JSON file
    const outputPath = './libs/database/src/seeds/neetcode250.json';
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, JSON.stringify({ problems }, null, 2), 'utf-8');

    console.log(`\n✅ Wrote ${problems.length} problems to ${outputPath}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review the generated file`);
    console.log(`   2. Run: pnpm db:seed (after creating seed script)`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
