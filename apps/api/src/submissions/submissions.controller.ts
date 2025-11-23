import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
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
}
