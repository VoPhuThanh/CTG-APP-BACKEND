import { metadataResponseDto } from '@/cores/dtos/metadata.dto';
import { PermissionDto } from '@/cores/dtos/permission.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RoleReponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  permission!: PermissionDto[];

  @ApiProperty()
  metadata!: metadataResponseDto;
}
