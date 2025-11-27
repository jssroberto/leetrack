import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateProposalDto } from '../src/challenges/dto/create-proposal.dto';

interface ProposalResponse {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  groupId: string;
  voteCount: number;
  hasVoted: boolean;
  voted?: boolean;
}

interface LoginResponse {
  accessToken: string;
}

interface GroupResponse {
  id: string;
}

describe('ProposalsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let groupId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 1. Register/Login to get token
    const email = `test-${Date.now()}@example.com`;
    const password = 'password123';

    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    const loginRes = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    authToken = (loginRes.body as LoginResponse).accessToken;

    // 2. Create a group
    const groupRes = await request(app.getHttpServer() as Server)
      .post('/groups')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Group' })
      .expect(201);

    groupId = (groupRes.body as GroupResponse).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/groups/:groupId/proposals (POST) - should create a proposal', () => {
    const dto: CreateProposalDto = {
      title: 'Dynamic Programming Week',
      description: 'Focus on 1D DP',
      targetDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    };

    return request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/proposals`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(dto)
      .expect(201)
      .expect((res) => {
        const body = res.body as ProposalResponse;
        expect(body.title).toBe(dto.title);
        expect(body.groupId).toBe(groupId);
      });
  });

  it('/groups/:groupId/proposals (POST) - should fail for non-members', async () => {
    // Create another user
    const email = `other-${Date.now()}@example.com`;
    const password = 'password123';
    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({ email, password });

    const loginRes = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email, password });

    const otherToken = (loginRes.body as LoginResponse).accessToken;

    const dto: CreateProposalDto = {
      title: 'Hacker Proposal',
      targetDate: new Date(Date.now() + 86400000).toISOString(),
    };

    return request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/proposals`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send(dto)
      .expect(403);
  });

  it('/groups/:groupId/proposals (GET) - should list proposals', async () => {
    // Create a proposal first
    const dto: CreateProposalDto = {
      title: 'Graph Week',
      targetDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    };
    await request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/proposals`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(dto)
      .expect(201);

    return request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/proposals`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as ProposalResponse[];
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        expect(body[0].voteCount).toBeDefined();
        expect(body[0].hasVoted).toBeDefined();
      });
  });

  it('/groups/:groupId/proposals/:id/vote (POST) - should toggle vote', async () => {
    // 1. Create proposal
    const dto: CreateProposalDto = {
      title: 'Vote Me',
      targetDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    };
    const createRes = await request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/proposals`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(dto)
      .expect(201);

    const proposalId = (createRes.body as ProposalResponse).id;

    // 2. Vote (Toggle On)
    await request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/proposals/${proposalId}/vote`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as ProposalResponse;
        expect(body.voted).toBe(true);
      });

    // 3. Verify count = 1
    await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/proposals`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as ProposalResponse[];
        const p = body.find((x) => x.id === proposalId);
        if (!p) throw new Error('Proposal not found');
        expect(p.voteCount).toBe(1);
        expect(p.hasVoted).toBe(true);
      });

    // 4. Vote again (Toggle Off)
    await request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/proposals/${proposalId}/vote`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as ProposalResponse;
        expect(body.voted).toBe(false);
      });

    // 5. Verify count = 0
    await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}/proposals`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as ProposalResponse[];
        const p = body.find((x) => x.id === proposalId);
        if (!p) throw new Error('Proposal not found');
        expect(p.voteCount).toBe(0);
        expect(p.hasVoted).toBe(false);
      });
  });
});
