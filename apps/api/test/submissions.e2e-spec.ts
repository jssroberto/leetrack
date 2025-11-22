import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'http';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface LoginResponse {
  accessToken: string;
}

interface SubmissionResponse {
  id: string;
  problemId: string;
}

describe('SubmissionsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Clean db
    await prisma.submission.deleteMany();
    await prisma.problem.deleteMany();
    await prisma.user.deleteMany();

    // Create user and get token
    const email = 'test@example.com';
    const password = 'password';

    // Register
    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    // Login
    const loginRes = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const body = loginRes.body as LoginResponse;
    jwtToken = body.accessToken;

    // Get user Id
    await prisma.user.findUnique({ where: { email } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/submissions (POST) - should lazy load problem and create submission', async () => {
    const problemData = {
      leetcodeId: 1,
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'EASY',
      tags: ['Array', 'Hash Table'],
    };

    const submissionData = {
      leetcodeUsername: 'testuser',
      lang: 'python',
      problem: problemData,
    };

    const response = await request(app.getHttpServer() as Server)
      .post('/submissions')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(submissionData)
      .expect(201);

    const submissionBody = response.body as SubmissionResponse;

    expect(submissionBody).toHaveProperty('id');
    expect(submissionBody.problemId).toBeDefined();

    // Verify problem was created
    const problem = await prisma.problem.findUnique({
      where: { leetcodeId: 1 },
    });
    expect(problem).toBeDefined();
    if (problem) {
      expect(problem.title).toBe('Two Sum');
    }

    // Verify submission was created
    const submission = await prisma.submission.findUnique({
      where: { id: submissionBody.id },
    });
    expect(submission).toBeDefined();
    if (submission && problem) {
      expect(submission.problemId).toBe(problem.id);
    }
  });
});
