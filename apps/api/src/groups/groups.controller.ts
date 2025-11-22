import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupsService } from './groups.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() createGroupDto: CreateGroupDto, @Request() req: AuthenticatedRequest) {
    return this.groupsService.create(createGroupDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.groupsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Post('join/:inviteCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  join(@Param('inviteCode') inviteCode: string, @Request() req: AuthenticatedRequest) {
    return this.groupsService.join(inviteCode, req.user.userId);
  }
}
