import { ApiProperty } from '@nestjs/swagger';
import { PostAttachment } from '../../attachments/entities/post-attachment.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class PostResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    postTitle!: string;

    @ApiProperty()
    content!: string;

    @ApiProperty()
    authorId!: string;

    @ApiProperty({ type: () => UserResponseDto })
    author!: UserResponseDto;

    @ApiProperty()
    viewsCount!: number;

    @ApiProperty()
    likesCount!: number;

    @ApiProperty()
    dislikesCount!: number;

    @ApiProperty()
    commentsCount!: number;

    @ApiProperty({ type: [PostAttachment] })
    attachments!: PostAttachment[];

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}
