import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import {
  ContactResponseDto,
  PublicContactResponseDto,
} from './dtos/contact.dto';
import { Contact } from './entities/contact.entity';

export function mapContactToPublicResponse(
  contact: Contact,
): PublicContactResponseDto {
  const dto = new PublicContactResponseDto();

  dto.addressEn = contact.addressEn;
  dto.addressVi = contact.addressVi;
  dto.hotline = contact.hotline;
  dto.email = contact.email;
  dto.googleMapEmbedUrl = contact.googleMapEmbedUrl;

  return dto;
}

export function mapContactToResponse(contact: Contact): ContactResponseDto {
  const dto = Object.assign(
    new ContactResponseDto(),
    mapContactToPublicResponse(contact),
  );

  dto.id = contact.id;
  dto.metadata = mapMetadataToResponse(contact);

  return dto;
}
