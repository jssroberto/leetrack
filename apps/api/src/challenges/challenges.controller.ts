import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';

interface AuthenticatedRequest extends Request {
  user: { userId: string };
}

@ApiTags('challenges')
@Controller({ path: 'groups/:groupId/challenges', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  create(
    @Param('groupId') groupId: string,
    @Body() createChallengeDto: CreateChallengeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.create(groupId, createChallengeDto, req.user.userId);
  }

  @Get()
  findAll(@Param('groupId') groupId: string, @Request() req: AuthenticatedRequest) {
    return this.challengesService.findAll(groupId, req.user.userId);
  }

  @Get(':id')
  findOne(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.findOne(groupId, id, req.user.userId);
  }

  @Put(':id')
  update(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() updateChallengeDto: CreateChallengeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.update(groupId, id, updateChallengeDto, req.user.userId);
  }

  @Delete(':id')
  remove(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.delete(groupId, id, req.user.userId);
  }
}
