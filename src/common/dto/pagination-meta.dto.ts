import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 15, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 1, description: 'Number of current page' })
  page: number;

  @ApiProperty({ example: 10, description: 'Limit of items on one page' })
  limit: number;

  @ApiProperty({ example: 2, description: 'Total number of pages' })
  totalPages: number;
}
