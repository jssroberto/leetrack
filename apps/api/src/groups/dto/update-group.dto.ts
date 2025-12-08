import { PartialType } from '@nestjs/swagger';
import { CreateGroupDto } from './create-group.dto';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @IsOptional()
  @IsString()
  @MinLength(6)
  inviteCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weeklyLeetcodes?: number;
}