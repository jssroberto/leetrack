import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProposalDto {
  @ApiProperty({ example: 'Dynamic Programming Week', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Arrays & Hashing' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Focus on 1D DP problems', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2023-11-27' })
  @IsDateString()
  targetDate: string;
}
