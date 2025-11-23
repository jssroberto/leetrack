import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'http';
import request from 'supertest';
import { AppModule } from './../src/app.module';

interface LoginResponse {
  accessToken: string;
}

interface GroupResponse {
  id: string;
  inviteCode: string;
  name: string;
  members: any[];
}

describe('GroupsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let memberToken: string;
  let memberId: string;
  let groupId: string;
  let inviteCode: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create Admin User
    const adminEmail = `admin_${Date.now()}@test.com`;
    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({ email: adminEmail, password: 'password123' })
      .expect(201);

    const adminLogin = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: adminEmail, password: 'password123' })
      .expect(201);
    const adminBody = adminLogin.body as LoginResponse;
    adminToken = adminBody.accessToken;

    // Create Member User
    const memberEmail = `member_${Date.now()}@test.com`;
    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({ email: memberEmail, password: 'password123' })
      .expect(201);

    const memberLogin = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: memberEmail, password: 'password123' })
      .expect(201);
    const memberBody = memberLogin.body as LoginResponse;
    memberToken = memberBody.accessToken;

    // Decode token to get member ID
    const tokenPayload = JSON.parse(
      Buffer.from(memberToken.split('.')[1], 'base64').toString(),
    ) as { sub: string };
    memberId = tokenPayload.sub;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/groups (POST) - Create Group', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Group' })
      .expect(201);

    const groupBody = response.body as GroupResponse;

    expect(groupBody).toHaveProperty('id');
    expect(groupBody).toHaveProperty('inviteCode');
    expect(groupBody.name).toBe('Test Group');

    groupId = groupBody.id;
    inviteCode = groupBody.inviteCode;
  });

  it('/groups/join/:inviteCode (POST) - Join Group', async () => {
    await request(app.getHttpServer() as Server)
      .post(`/groups/join/${inviteCode}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(201);

    // Verify membership
    const group = await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const groupBody = group.body as GroupResponse;
    expect(groupBody.members).toHaveLength(2);
  });

  it('/groups/:id/leave (POST) - Leave Group', async () => {
    await request(app.getHttpServer() as Server)
      .post(`/groups/${groupId}/leave`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(201);

    // Verify membership
    const group = await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const groupBody = group.body as GroupResponse;
    expect(groupBody.members).toHaveLength(1);
  });

  it('/groups/join/:inviteCode (POST) - Rejoin Group', async () => {
    await request(app.getHttpServer() as Server)
      .post(`/groups/join/${inviteCode}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(201);
  });

  it('/groups/:id/members/:userId (DELETE) - Kick Member', async () => {
    await request(app.getHttpServer() as Server)
      .delete(`/groups/${groupId}/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Verify membership
    const group = await request(app.getHttpServer() as Server)
      .get(`/groups/${groupId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const groupBody = group.body as GroupResponse;
    expect(groupBody.members).toHaveLength(1);
  });

  it('/groups/:id/members/:userId (DELETE) - Fail to Kick Admin', async () => {
    // Admin tries to kick themselves (should fail with 400 or 403 depending on implementation,
    // but here we implemented self-kick check as 400 BadRequest)

    // Let's test self-kick
    const tokenPayload = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString()) as {
      sub: string;
    };
    const adminId = tokenPayload.sub;
    await request(app.getHttpServer() as Server)
      .delete(`/groups/${groupId}/members/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });
});
