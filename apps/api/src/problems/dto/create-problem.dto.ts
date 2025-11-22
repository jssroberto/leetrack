import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsString } from 'class-validator';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class CreateProblemDto {
  @ApiProperty()
  @IsInt()
  leetcodeId: number;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ enum: Difficulty })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
