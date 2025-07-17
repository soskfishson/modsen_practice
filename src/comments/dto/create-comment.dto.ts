import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAttachmentDto as BaseCreateAttachmentDto } from '../../attachments/dto/base-create-attachment.dto';

export class CreateCommentDto {
    @ApiProperty({ example: 'My post content' })
    @IsOptional()
    @IsString()
    content!: string;

    @ApiProperty({
        type: () => [BaseCreateAttachmentDto],
        description: 'List of new attachments for the post',
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BaseCreateAttachmentDto)
    attachments?: BaseCreateAttachmentDto[];

    @IsString()
    @ApiProperty({ description: 'Post this comment refers to', example: 'abc1234411...' })
    postId!: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Comment this comment refers to', example: 'abc1234411...' })
    parentCommentId?: string;
}
