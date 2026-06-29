import { UserDto } from './user.dto';

export class metadataResponseDto {
  createdAt!: Date;
  createdBy?: UserDto | null;

  updatedAt!: Date;
  updatedBy?: UserDto | null;

  deletedAt!: Date;
  deletedBy?: UserDto | null;
}
