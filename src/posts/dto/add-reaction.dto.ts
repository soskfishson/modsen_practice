import { ReactionType } from '../entities/reaction.entity';
import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddReactionDto {
    @ApiProperty({
        description: 'Type of reaction user rates the post',
        example: 'LIKE',
    })
    @IsIn([...Object.values(ReactionType), null])
    type: ReactionType | null;

    @ApiProperty({
        description: 'Id of a post user reacts to',
    })
    @IsString()
    postId: string;
}
