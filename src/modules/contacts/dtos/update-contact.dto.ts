import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ContactUpdateDto {
  @ApiProperty({ maxLength: 500 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  addressEn!: string;

  @ApiProperty({ maxLength: 500 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  addressVi!: string;

  @ApiProperty({ example: '0900000000', maxLength: 50 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  hotline!: string;

  @ApiProperty({ example: 'hello@ctg.example', maxLength: 254 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    format: 'uri',
    example: 'https://www.google.com/maps/embed?pb=...',
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    require_valid_protocol: true,
  })
  @Matches(
    /^https:\/\/(?:www\.google\.com\/maps\/embed(?:[/?#]|$)|maps\.google\.com(?:[/?#]|$))/i,
    {
      message:
        'googleMapEmbedUrl must be an HTTPS Google Maps embed URL, not iframe HTML',
    },
  )
  @MaxLength(2000)
  googleMapEmbedUrl!: string;
}
