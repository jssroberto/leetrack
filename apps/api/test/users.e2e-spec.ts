import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtToken: string;
  let userId: string;
  let groupId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Clean db
    await prisma.challengeProblem.deleteMany();
    await prisma.challenge.deleteMany();
    await prisma.problem.deleteMany();
    await prisma.category.deleteMany();
    await prisma.userGroup.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    // Create user and login
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201);

    jwtToken = loginResponse.body.accessToken;

    // Get user id from token or profile
    const profile = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    userId = profile.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/me/active-challenge-problems (GET)', () => {
    it('should return empty list when user has no groups', () => {
      return request(app.getHttpServer())
        .get('/users/me/active-challenge-problems')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect([]);
    });

    it('should return problems when user has active challenges', async () => {
      // 1. Create Group
      const groupRes = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ name: 'Test Group' })
        .expect(201);

      groupId = groupRes.body.id;

      // 2. Create Category and Problem (needed for challenge)
      const category = await prisma.category.create({
        data: { name: 'Arrays', slug: 'arrays' },
      });

      const problem = await prisma.problem.create({
        data: {
          leetcodeId: 1,
          slug: 'two-sum',
          title: 'Two Sum',
          difficulty: 'EASY',
          categoryId: category.id,
        },
      });

      // 3. Create Challenge
      await request(app.getHttpServer())
        .post(`/groups/${groupId}/challenges`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Challenge 1',
          problemIds: [problem.id],
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        })
        .expect(201);

      // 4. Fetch Active Problems
      const res = await request(app.getHttpServer())
        .get('/users/me/active-challenge-problems')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].slug).toBe('two-sum');
      expect(res.body[0].challengeId).toBeDefined();
    });
  });
});
