import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { ProposalsController } from './proposals.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ChallengesController, ProposalsController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
