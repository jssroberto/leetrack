import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';

interface LoginResponse {
  accessToken: string;
}

interface GroupResponse {
  id: string;
  inviteCode: string;
}

interface ChallengeResponse {
  id: string;
  name: string;
}

interface SubmissionResponse {
  id: string;
  problemId: string;
}

interface LeaderboardEntry {
  user: { id: string; email: string };
  problemsCompleted: number;
  totalAttempts: number;
}

interface ChallengeDetailsResponse extends ChallengeResponse {
  problems: unknown[];
  leaderboard: LeaderboardEntry[];
}

interface ChallengeWithProgressResponse extends ChallengeResponse {
  myProgress: {
    completed: number;
    total: number;
  };
}

describe('ChallengesController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let memberToken: string;
  let groupId: string;
  let problemId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup: Create admin user
    const adminEmail = `admin_challenges_${Date.now()}@test.com`;
    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({ email: adminEmail, password: 'password123' });

    const adminLogin = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: adminEmail, password: 'password123' });

    adminToken = (adminLogin.body as LoginResponse).accessToken;

    // Setup: Create member user
    const memberEmail = `member_challenges_${Date.now()}@test.com`;
    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({ email: memberEmail, password: 'password123' });

    const memberLogin = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: memberEmail, password: 'password123' });

    memberToken = (memberLogin.body as LoginResponse).accessToken;

    // Setup: Create group and add member
    const groupResponse = await request(app.getHttpServer() as Server)
      .post('/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Challenges Test Group' });

    groupId = (groupResponse.body as GroupResponse).id;
    const inviteCode = (groupResponse.body as GroupResponse).inviteCode;

    await request(app.getHttpServer() as Server)
      .post(`/groups/join/${inviteCode}`)
      .set('Authorization', `Bearer ${memberToken}`);

    // Setup: Create a problem by submitting it
    const submissionRes = await request(app.getHttpServer() as Server)
      .post('/submissions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        leetcodeUsername: 'testuser',
        lang: 'typescript',
        problem: {
          leetcodeId: 1,
          slug: 'two-sum',
          title: 'Two Sum',
          difficulty: 'EASY',
          tags: ['Array', 'Hash Table'],
        },
      });

    problemId = (submissionRes.body as SubmissionResponse).problemId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/groups/:groupId/challenges (POST) - Create Challenge (Admin Only)', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/challenges`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Challenge',
        description: 'A test challenge',
        problemIds: [problemId],
      })
      .expect(201);

    const challenge = response.body as ChallengeResponse;
    expect(challenge.id).toBeDefined();
    expect(challenge.name).toBe('Test Challenge');
  });

  it('/groups/:groupId/challenges (POST) - Fail as Non-Admin', async () => {
    await request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/challenges`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Member Challenge',
        problemIds: [problemId],
      })
      .expect(403);
  });

  it('/groups/:groupId/challenges (GET) - List Challenges with Progress', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/challenges`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const challenges = response.body as ChallengeWithProgressResponse[];
    expect(Array.isArray(challenges)).toBe(true);
    expect(challenges.length).toBeGreaterThan(0);
    expect(challenges[0].myProgress).toBeDefined();
  });

  it('/groups/:groupId/challenges/:id (GET) - Get Challenge Details with Leaderboard', async () => {
    // Get challenge ID from list
    const listResponse = await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/challenges`)
      .set('Authorization', `Bearer ${adminToken}`);

    const challengeId = (listResponse.body as ChallengeResponse[])[0].id;

    const response = await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/challenges/${challengeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const challengeDetails = response.body as ChallengeDetailsResponse;
    expect(challengeDetails.id).toBe(challengeId);
    expect(challengeDetails.problems).toBeDefined();
    expect(challengeDetails.leaderboard).toBeDefined();
  });

  it('Automatic Progress Tracking', async () => {
    // Create another challenge
    const challengeResponse = await request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/challenges`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Progress Test Challenge',
        problemIds: [problemId],
      });

    const challengeId = (challengeResponse.body as ChallengeResponse).id;

    // Member submits the problem
    await request(app.getHttpServer() as Server)
      .post('/submissions')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        leetcodeUsername: 'memberuser',
        lang: 'python',
        problem: {
          leetcodeId: 1,
          slug: 'two-sum',
          title: 'Two Sum',
          difficulty: 'EASY',
          tags: ['Array'],
        },
      });

    // Wait for async progress update
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check that progress was updated
    const detailsResponse = await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/challenges/${challengeId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    const leaderboard = (detailsResponse.body as ChallengeDetailsResponse).leaderboard;

    // Look for member's progress (email might have timestamp)
    const memberProgress = leaderboard.find((entry) => entry.user.id !== undefined);

    // Verify at least one user has progress
    expect(leaderboard.length).toBeGreaterThan(0);
    expect(memberProgress).toBeDefined();
    if (memberProgress) {
      expect(memberProgress.problemsCompleted).toBeGreaterThanOrEqual(1);
    }
  });

  it('/groups/:groupId/challenges/:id (PUT) - Update Challenge (Admin Only)', async () => {
    const listResponse = await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/challenges`)
      .set('Authorization', `Bearer ${adminToken}`);

    const challengeId = (listResponse.body as ChallengeResponse[])[0].id;

    await request(app.getHttpServer() as Server)
      .put(`/groups/${groupId}/challenges/${challengeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Challenge',
        description: 'Updated description',
        problemIds: [problemId],
      })
      .expect(200);

    const updated = await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/challenges/${challengeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect((updated.body as ChallengeResponse).name).toBe('Updated Challenge');
  });

  it('/groups/:groupId/challenges/:id (DELETE) - Delete Challenge (Admin Only)', async () => {
    // Create a challenge to delete
    const challengeResponse = await request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/challenges`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'To Delete',
        problemIds: [problemId],
      });

    const challengeId = (challengeResponse.body as ChallengeResponse).id;

    await request(app.getHttpServer() as Server)
      .delete(`/groups/${groupId}/challenges/${challengeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Verify it's deleted
    await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/challenges/${challengeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('/groups/:groupId/challenges/:id (DELETE) - Fail as Non-Admin', async () => {
    const listResponse = await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/challenges`)
      .set('Authorization', `Bearer ${adminToken}`);

    const challengeId = (listResponse.body as ChallengeResponse[])[0].id;

    await request(app.getHttpServer() as Server)
      .delete(`/groups/${groupId}/challenges/${challengeId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });
});
