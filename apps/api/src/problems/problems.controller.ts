import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProblemsService } from './problems.service';

@ApiTags('Problems')
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all problems',
    description: 'Returns a list of all available problems',
  })
  @ApiOkResponse({ description: 'List of problems retrieved successfully' })
  findAll() {
    return this.problemsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get problem by ID',
    description: 'Returns detailed information about a specific problem',
  })
  @ApiParam({ name: 'id', description: 'Problem ID' })
  @ApiOkResponse({ description: 'Problem details retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  findOne(@Param('id') id: string) {
    return this.problemsService.findOne(id);
  }
}
