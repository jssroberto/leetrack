import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
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
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new group',
    description: 'Creates a new group and assigns the creator as admin',
  })
  @ApiCreatedResponse({ description: 'Group successfully created' })
  @ApiBadRequestResponse({ description: 'Invalid group data' })
  create(@Body() createGroupDto: CreateGroupDto, @Request() req: AuthenticatedRequest) {
    return this.groupsService.create(createGroupDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all user groups',
    description: 'Returns all groups the authenticated user is a member of',
  })
  @ApiOkResponse({ description: 'List of groups retrieved successfully' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.groupsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get group details',
    description: 'Returns detailed information about a specific group including members',
  })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiOkResponse({ description: 'Group details retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Group not found' })
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Post('join/:inviteCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Join a group',
    description: 'Join a group using an invite code',
  })
  @ApiParam({ name: 'inviteCode', description: 'Group invite code' })
  @ApiOkResponse({ description: 'Successfully joined the group' })
  @ApiNotFoundResponse({ description: 'Invalid invite code' })
  join(@Param('inviteCode') inviteCode: string, @Request() req: AuthenticatedRequest) {
    return this.groupsService.join(inviteCode, req.user.userId);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Leave a group',
    description: 'Remove yourself from a group',
  })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiOkResponse({ description: 'Successfully left the group' })
  @ApiNotFoundResponse({ description: 'Group not found or not a member' })
  leave(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.groupsService.leaveGroup(id, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update group settings',
    description: 'Updates group name, invite code, or weekly goals (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiOkResponse({ description: 'Group updated successfully' })
  @ApiForbiddenResponse({ description: 'Only admins can update the group' })
  update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.update(id, req.user.userId, updateGroupDto);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Kick a member from group',
    description: 'Remove a member from the group (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiParam({ name: 'userId', description: 'User ID to kick' })
  @ApiOkResponse({ description: 'Member successfully removed' })
  @ApiForbiddenResponse({ description: 'Only admins can kick members' })
  @ApiNotFoundResponse({ description: 'Group or user not found' })
  @ApiBadRequestResponse({ description: 'Cannot kick yourself or another admin' })
  kick(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.kickMember(id, req.user.userId, userId);
  }
}
