import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

import { ChallengesModule } from './challenges/challenges.module';
import { GroupsModule } from './groups/groups.module';
import { ProblemsModule } from './problems/problems.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ProblemsModule,
    SubmissionsModule,
    GroupsModule,
    ChallengesModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
