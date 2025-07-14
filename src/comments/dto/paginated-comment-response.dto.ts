import { ApiProperty } from '@nestjs/swagger';
import { CommentResponseDto } from './comment-response.dto';

export class PaginatedCommentResponseDto {
    @ApiProperty({
        description: 'Array of comments for the current page.',
        type: [CommentResponseDto],
    })
    data: CommentResponseDto[];

    @ApiProperty({
        description: 'Total number of comments matching the query.',
        example: 128,
    })
    total: number;

    @ApiProperty({
        description: 'The current page number.',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: 'The number of items per page.',
        example: 10,
    })
    limit: number;

    @ApiProperty({
        description: 'The total number of pages available.',
        example: 13,
    })
    totalPages: number;
}
