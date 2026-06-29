import { RoleReponseDto } from '@/modules/roles/dtos/role.dto';
import { metadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  role!: RoleReponseDto;

  @ApiProperty()
  metadata!: metadataResponseDto;
}
