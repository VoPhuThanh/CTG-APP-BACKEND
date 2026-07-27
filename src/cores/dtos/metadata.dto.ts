import { UserDto } from './user.dto';

export class MetadataResponseDto {
  createdAt!: Date;
  createdBy?: UserDto | null;

  updatedAt!: Date;
  updatedBy?: UserDto | null;

  deletedAt!: Date | undefined;
  deletedBy?: UserDto | null;
}
