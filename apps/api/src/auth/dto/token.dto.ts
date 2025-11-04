import { ApiProperty } from '@nestjs/swagger';

export class TokenDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 86400 })
  expiresIn!: number;
}
