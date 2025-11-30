import { Role } from '@leetrack/database';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { GroupsService } from './groups.service';

describe('GroupsService', () => {
  let service: GroupsService;

  const mockPrismaService = {
    group: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    userGroup: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should generate a unique invite code and create a group', async () => {
      const createGroupDto = { name: 'Test Group' };
      const userId = 'user-id';

      // Mock findUnique to return null (no collision)
      mockPrismaService.group.findUnique.mockResolvedValue(null);
      // Mock findFirst to return null (no existing group with same name)
      mockPrismaService.group.findFirst.mockResolvedValue(null);

      const expectedGroup = {
        id: 'group-id',
        name: 'Test Group',
        inviteCode: 'ABCD-1234',
        members: [],
      };

      mockPrismaService.group.create.mockImplementation(
        (args: { data: { inviteCode: string } }) => {
          return Promise.resolve({
            ...expectedGroup,
            inviteCode: args.data.inviteCode, // Use the generated code
          });
        },
      );

      const result = await service.create(createGroupDto, userId);

      expect(result).toBeDefined();
      // Expect format XXXX-XXXX (9 chars)
      expect(result.inviteCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(mockPrismaService.group.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.group.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            inviteCode: expect.stringMatching(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/),
          }),
        }),
      );
    });

    it('should retry if invite code collision occurs', async () => {
      const createGroupDto = { name: 'Test Group' };
      const userId = 'user-id';

      // Mock findUnique to return existing group once, then null
      mockPrismaService.group.findUnique
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      mockPrismaService.group.create.mockResolvedValue({ id: 'new-group' });

      await service.create(createGroupDto, userId);

      expect(mockPrismaService.group.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if user already has a group with the same name', async () => {
      const createGroupDto = { name: 'Duplicate Group' };
      const userId = 'user-id';

      // Mock findFirst to return an existing group
      mockPrismaService.group.findFirst.mockResolvedValue({ id: 'existing-group' });

      await expect(service.create(createGroupDto, userId)).rejects.toThrow(
        'You already have a group with this name',
      );

      expect(mockPrismaService.group.findFirst).toHaveBeenCalledWith({
        where: {
          name: createGroupDto.name,
          members: {
            some: {
              userId,
              role: Role.ADMIN,
            },
          },
        },
      });
    });
  });
});
