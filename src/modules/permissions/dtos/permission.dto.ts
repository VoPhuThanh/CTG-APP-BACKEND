import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  metadata!: MetadataResponseDto;
}
