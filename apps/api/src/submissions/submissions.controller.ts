import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubmissionsService } from './submissions.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('Submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create submission',
    description: 'Record a problem submission from LeetCode',
  })
  @ApiCreatedResponse({ description: 'Submission recorded successfully' })
  @ApiBadRequestResponse({ description: 'Invalid submission data' })
  create(@Body() createSubmissionDto: CreateSubmissionDto, @Request() req: AuthenticatedRequest) {
    return this.submissionsService.create(createSubmissionDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all submissions',
    description: 'Returns all submissions for the authenticated user',
  })
  @ApiOkResponse({ description: 'Submissions retrieved successfully' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.submissionsService.findAll(req.user.userId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get submissions by specific user ID',
    description:
      'Returns all submissions for a specific user provided by ID (Admin or public profile use)',
  })
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user to retrieve submissions for',
    type: String,
  })
  @ApiOkResponse({ description: 'User submissions retrieved successfully' })
  findAllByUser(@Param('userId') userId: string) {
    // Reutilizamos el mismo método del servicio, pero pasamos el ID de la URL
    // en lugar del ID del token JWT.
    return this.submissionsService.findAll(userId);
  }
  @Get('group/:groupId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get submissions by group',
    description:
      'Returns a feed of submissions from all members of a specific group, ordered by date',
  })
  @ApiParam({
    name: 'groupId',
    description: 'The ID of the group to retrieve submissions for',
    type: String,
  })
  @ApiOkResponse({ description: 'Group submissions retrieved successfully' })
  findAllByGroup(@Param('groupId') groupId: string) {
    return this.submissionsService.findByGroup(groupId);
  }
}
