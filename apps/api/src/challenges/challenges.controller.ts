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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';

interface AuthenticatedRequest extends Request {
  user: { userId: string };
}

@ApiTags('Challenges')
@Controller({ path: 'groups/:groupId/challenges', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create challenge',
    description: 'Create a new challenge for a group (admin only)',
  })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiCreatedResponse({ description: 'Challenge created successfully' })
  @ApiForbiddenResponse({ description: 'Only group admins can create challenges' })
  @ApiBadRequestResponse({ description: 'Invalid challenge data or problem IDs' })
  create(
    @Param('groupId') groupId: string,
    @Body() createChallengeDto: CreateChallengeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.create(groupId, createChallengeDto, req.user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'List all challenges',
    description: 'Returns all challenges for a group with user progress',
  })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiOkResponse({ description: 'Challenges retrieved successfully' })
  @ApiForbiddenResponse({ description: 'Not a member of this group' })
  findAll(@Param('groupId') groupId: string, @Request() req: AuthenticatedRequest) {
    return this.challengesService.findAll(groupId, req.user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get challenge details',
    description: 'Returns challenge details with problems and leaderboard',
  })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiOkResponse({ description: 'Challenge details retrieved successfully' })
  @ApiForbiddenResponse({ description: 'Not a member of this group' })
  @ApiNotFoundResponse({ description: 'Challenge not found' })
  findOne(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.findOne(groupId, id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update challenge',
    description: 'Update an existing challenge (admin only)',
  })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiOkResponse({ description: 'Challenge updated successfully' })
  @ApiForbiddenResponse({ description: 'Only group admins can update challenges' })
  @ApiNotFoundResponse({ description: 'Challenge not found' })
  @ApiBadRequestResponse({ description: 'Invalid challenge data' })
  update(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() updateChallengeDto: CreateChallengeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.update(groupId, id, updateChallengeDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete challenge',
    description: 'Delete a challenge (admin only)',
  })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiOkResponse({ description: 'Challenge deleted successfully' })
  @ApiForbiddenResponse({ description: 'Only group admins can delete challenges' })
  @ApiNotFoundResponse({ description: 'Challenge not found' })
  remove(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.delete(groupId, id, req.user.userId);
  }
}
