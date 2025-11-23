import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateChallengeDto {
  @ApiProperty({ example: 'Arrays Mastery' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Complete all array problems' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsISO8601()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ example: ['uuid1', 'uuid2'], description: 'Array of problem IDs' })
  @IsArray()
  @ArrayMinSize(1)
  problemIds: string[];
}
