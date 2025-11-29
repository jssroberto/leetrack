import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengesService } from './challenges.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

interface AuthenticatedRequest extends Request {
  user: { userId: string };
}

@ApiTags('Proposals')
@Controller({ path: 'groups/:groupId/proposals', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProposalsController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @ApiOperation({ summary: 'Create challenge proposal' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiCreatedResponse({ description: 'Proposal created successfully' })
  create(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateProposalDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.createProposal(groupId, dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List challenge proposals' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiOkResponse({ description: 'Proposals retrieved successfully' })
  findAll(@Param('groupId', ParseUUIDPipe) groupId: string, @Request() req: AuthenticatedRequest) {
    return this.challengesService.findAllProposals(groupId, req.user.userId);
  }

  @Post(':proposalId/vote')
  @HttpCode(200)
  @ApiOperation({ summary: 'Toggle vote for a proposal' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'proposalId', description: 'Proposal ID' })
  @ApiOkResponse({ description: 'Vote toggled successfully' })
  vote(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.toggleVote(groupId, proposalId, req.user.userId);
  }

  @Post(':proposalId/convert')
  @ApiOperation({ summary: 'Convert a proposal into a challenge (Admin only)' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'proposalId', description: 'Proposal ID' })
  @ApiCreatedResponse({ description: 'Challenge created successfully from proposal' })
  convert(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.challengesService.convertProposalToChallenge(groupId, proposalId, req.user.userId);
  }
}
