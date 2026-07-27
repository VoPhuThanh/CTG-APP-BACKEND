import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReorderCollectionDto {
  @ApiProperty({
    description:
      'Complete ordered list of active record IDs in the selected scope. The first ID is stored at displayOrder 0.',
    type: [String],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  orderedIds!: string[];
}
