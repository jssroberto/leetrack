import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    getActiveChallengeProblems: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getActiveChallengeProblems', () => {
    it('should return active challenge problems', async () => {
      const userId = 'user-123';
      const mockProblems = [
        {
          id: 'prob-1',
          leetcodeId: 1,
          slug: 'two-sum',
          title: 'Two Sum',
          difficulty: 'EASY',
          challengeId: 'chal-1',
          groupId: 'group-1',
        },
      ];

      mockUsersService.getActiveChallengeProblems.mockResolvedValue(mockProblems);

      const result = await controller.getActiveChallengeProblems({
        user: { userId },
      } as any);

      expect(service.getActiveChallengeProblems).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockProblems);
    });
  });
});
