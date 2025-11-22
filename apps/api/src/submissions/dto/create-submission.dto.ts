import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsString, ValidateNested } from 'class-validator';
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
}
