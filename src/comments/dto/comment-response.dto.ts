import { ApiProperty } from '@nestjs/swagger';
import { CommentAttachment } from '../../attachments/entities/comment-attachment.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class CommentResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    content!: string;

    @ApiProperty()
    authorId!: string;

    @ApiProperty({ type: () => UserResponseDto })
    author!: UserResponseDto;

    @ApiProperty({ nullable: true })
    postId?: string;

    @ApiProperty({ nullable: true })
    parentCommentId?: string;

    @ApiProperty()
    likesCount!: number;

    @ApiProperty()
    dislikesCount!: number;

    @ApiProperty({ type: [CommentAttachment] })
    attachments!: CommentAttachment[];

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;

    @ApiProperty({ type: [() => CommentResponseDto], nullable: true })
    replies?: CommentResponseDto[];
}
