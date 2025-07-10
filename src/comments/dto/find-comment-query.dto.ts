import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, IsIn, IsUUID } from 'class-validator';

export class FindCommentsQueryDto {
    @ApiPropertyOptional({
        description: 'The ID of the comment to find.',
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    })
    @IsOptional()
    @IsUUID()
    id?: string;

    @ApiPropertyOptional({
        description: 'Generic search term to filter comments by content or author.',
        example: 'great comment',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Page number for pagination.',
        minimum: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page.',
        minimum: 1,
        maximum: 100,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Field to sort by.',
        example: 'createdAt',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort order.',
        enum: ['ASC', 'DESC'],
        default: 'DESC',
    })
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({
        description: 'Comma-separated list of fields to return.',
        example: 'id,content,authorId',
    })
    @IsOptional()
    @IsString()
    fields?: string;

    @ApiPropertyOptional({
        description: 'Filter comments by author ID.',
        example: 'some-user-uuid',
    })
    @IsOptional()
    @IsUUID()
    authorId?: string;

    @ApiPropertyOptional({
        description: 'Filter comments by post ID.',
        example: 'some-post-uuid',
    })
    @IsOptional()
    @IsUUID()
    postId?: string;

    @ApiPropertyOptional({
        description: 'Filter comments by parent comment ID (for replies).',
        example: 'some-comment-uuid',
    })
    @IsOptional()
    @IsUUID()
    parentCommentId?: string;

    [key: string]: any;
}
