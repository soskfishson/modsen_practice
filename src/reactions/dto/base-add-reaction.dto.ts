import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '../interfaces/reaction.interface';

export class BaseAddReactionDto {
    @ApiProperty({
        description: 'Type of reaction user rates the parent (post or comment)',
        example: 'LIKE',
    })
    @IsIn([...Object.values(ReactionType), null])
    type: ReactionType | null;

    @ApiProperty({
        description: 'Id of the parent (post or comment) user reacts to',
    })
    @IsString()
    parentId: string;
} 