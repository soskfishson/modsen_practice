import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAttachmentDto } from './create-atachment.dto';

export class CreatePostDto {
    @ApiProperty({ example: 'My title' })
    @IsString()
    postTitle: string;

    @ApiProperty({ example: 'My post content' })
    @IsOptional()
    @IsString()
    content: string;

    @ApiProperty({
        type: () => [CreateAttachmentDto],
        description: 'List of new attachments for the post',
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAttachmentDto)
    attachments?: CreateAttachmentDto[];
}
