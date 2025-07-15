import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '../interfaces/reaction.interface';

export class BaseAddReactionDto {
    @ApiProperty({ enum: ReactionType, enumName: 'ReactionType', nullable: true })
    @IsEnum(ReactionType)
    type!: ReactionType | null;

    @ApiProperty({
        description: 'ID of the parent entity (post or comment) to which the reaction belongs',
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    })
    @IsUUID()
    parentId!: string;
}
