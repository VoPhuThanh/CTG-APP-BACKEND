import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { PermissionDto } from '@/cores/dtos/permission.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RoleReponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  permissions!: PermissionDto[];

  @ApiProperty()
  metadata!: MetadataResponseDto;
}
