import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateProblemDto } from '../../problems/dto/create-problem.dto';

export class CreateSubmissionDto {
  @ApiProperty()
  @IsString()
  leetcodeUsername: string;

  @ApiProperty()
  @IsString()
  lang: string;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateProblemDto)
  problem: CreateProblemDto;

  @ApiProperty({ enum: ['STRUGGLED', 'NEEDED_HINTS', 'SOLVED_ALONE', 'EASY'], required: false })
  @IsOptional()
  @IsEnum(['STRUGGLED', 'NEEDED_HINTS', 'SOLVED_ALONE', 'EASY'])
  confidenceLevel?: 'STRUGGLED' | 'NEEDED_HINTS' | 'SOLVED_ALONE' | 'EASY';
}
