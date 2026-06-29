import { metadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty } from '@nestjs/swagger';

export class permissionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  metadata!: metadataResponseDto;
}
