import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty } from '@nestjs/swagger';
import { RoleDto } from '@/cores/dtos/role.dto';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  role!: RoleDto;

  @ApiProperty()
  metadata!: MetadataResponseDto;
}
