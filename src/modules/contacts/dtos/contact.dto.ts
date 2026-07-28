import { MetadataResponseDto } from '@/cores/dtos/metadata.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PublicContactResponseDto {
  @ApiProperty()
  addressEn!: string;

  @ApiProperty()
  addressVi!: string;

  @ApiProperty()
  hotline!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({
    format: 'uri',
    example: 'https://www.google.com/maps/embed?pb=...',
  })
  googleMapEmbedUrl!: string;
}

export class ContactResponseDto extends PublicContactResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: MetadataResponseDto })
  metadata!: MetadataResponseDto;
}
