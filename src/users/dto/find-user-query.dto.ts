import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, IsIn } from 'class-validator';

export class FindUsersQueryDto {
    @ApiPropertyOptional({
        description: 'Generic search term to filter users by username, email, or display name.',
        example: 'john',
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
