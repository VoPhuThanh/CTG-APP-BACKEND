import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateRolePermissionDto {
  @ApiProperty({
    type: String,
    isArray: true,
    format: 'uuid',
  })
  @IsUUID(undefined, { each: true })
  permissionId!: string[];
}
