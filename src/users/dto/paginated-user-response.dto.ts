import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class PaginatedUserResponseDto {
    @ApiProperty({
        description: 'Array of users for the current page.',
        type: [UserResponseDto],
    })
    data!: UserResponseDto[];

    @ApiProperty({
        description: 'Total number of users matching the query.',
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
