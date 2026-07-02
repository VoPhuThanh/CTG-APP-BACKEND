import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponseDto } from './auth-user.dto';

export class LoginReponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;
}
