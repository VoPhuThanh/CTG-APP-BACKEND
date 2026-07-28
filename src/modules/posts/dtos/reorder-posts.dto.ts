import { ReorderCollectionDto } from '@/cores/ordering/dtos/reorder-collection.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PostReorderQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  categoryId!: string;
}

export class PostReorderDto extends ReorderCollectionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  categoryId!: string;
}
