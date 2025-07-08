import { ApiProperty } from '@nestjs/swagger';
import { Attachment } from '../entities/attachment.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class PostResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    postTitle: string;

    @ApiProperty()
    content: string;

    @ApiProperty()
    authorId: string;

    @ApiProperty({ type: () => UserResponseDto })
    author: UserResponseDto;

    @ApiProperty()
    viewsCount: number;

    @ApiProperty()
    likesCount: number;

    @ApiProperty()
    dislikesCount: number;

    @ApiProperty()
    commentsCount: number;

    @ApiProperty({ type: [Attachment] })
    attachments: Attachment[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
