import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, IsIn, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindUsersQueryDto {
    @ApiPropertyOptional({
        description: 'The ID of the user to find.',
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    })
    @IsOptional()
    @IsUUID()
    id?: string;

    @ApiPropertyOptional({
        description: 'Generic search term to filter users by username, email, or display name.',
        example: 'john',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
        example: 'username',
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
        example: 'id,username,email',
    })
    @IsOptional()
    @IsString()
    fields?: string;
    [key: string]: any;
}
