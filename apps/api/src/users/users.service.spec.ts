import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    userGroup: {
      findMany: jest.fn(),
    },
    challenge: {
      findMany: jest.fn(),
    },
    challengeProblem: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActiveChallengeProblems', () => {
    const userId = 'user-123';

    it('should return empty array if user has no groups', async () => {
      mockPrismaService.userGroup.findMany.mockResolvedValue([]);

      const result = await service.getActiveChallengeProblems(userId);

      expect(result).toEqual([]);
      expect(prisma.userGroup.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { groupId: true },
      });
      expect(prisma.challenge.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array if no active challenges', async () => {
      mockPrismaService.userGroup.findMany.mockResolvedValue([{ groupId: 'g1' }]);
      mockPrismaService.challenge.findMany.mockResolvedValue([]);

      const result = await service.getActiveChallengeProblems(userId);

      expect(result).toEqual([]);
      expect(prisma.challenge.findMany).toHaveBeenCalled();
      expect(prisma.challengeProblem.findMany).not.toHaveBeenCalled();
    });

    it('should return unique problems from active challenges', async () => {
      mockPrismaService.userGroup.findMany.mockResolvedValue([{ groupId: 'g1' }]);
      mockPrismaService.challenge.findMany.mockResolvedValue([{ id: 'c1', groupId: 'g1' }]);
      mockPrismaService.challengeProblem.findMany.mockResolvedValue([
        {
          problem: {
            id: 'p1',
            leetcodeId: 1,
            slug: 'two-sum',
            title: 'Two Sum',
            difficulty: 'EASY',
          },
          challenge: { id: 'c1', groupId: 'g1' },
        },
        {
          problem: {
            id: 'p1', // Duplicate problem
            leetcodeId: 1,
            slug: 'two-sum',
            title: 'Two Sum',
            difficulty: 'EASY',
          },
          challenge: { id: 'c1', groupId: 'g1' },
        },
      ]);

      const result = await service.getActiveChallengeProblems(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
      expect(result[0].challengeId).toBe('c1');
    });
  });
});
