import { ApiProperty } from '@nestjs/swagger';
import { PostResponseDto } from './post-response.dto';

export class PaginatedPostResponseDto {
    @ApiProperty({
        description: 'Array of posts for the current page.',
        type: [PostResponseDto],
    })
    data!: PostResponseDto[];

    @ApiProperty({
        description: 'Total number of posts matching the query.',
        example: 128,
    })
    total!: number;

    @ApiProperty({
        description: 'The current page number.',
        example: 1,
    })
    page!: number;

    @ApiProperty({
        description: 'The number of items per page.',
        example: 10,
    })
    limit!: number;

    @ApiProperty({
        description: 'The total number of pages available.',
        example: 13,
    })
    totalPages!: number;
}
