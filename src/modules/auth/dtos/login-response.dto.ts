import { UserResponseDto } from '@/modules/users/dtos/users.reponse.dto';
import { ApiProperty } from '@nestjs/swagger';

export class LoginReponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
