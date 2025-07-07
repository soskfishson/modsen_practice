import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';
import { CreateAttachmentDto } from './create-atachment.dto';
import { UpdateAttachmentDto } from './update-attachment.dto';
import { IsArray, IsOptional, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto extends PartialType(OmitType(CreatePostDto, ['attachments'] as const)) {
    @ApiProperty({
        type: () => [CreateAttachmentDto],
        description: 'List of new attachments to add to the post',
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAttachmentDto)
    newAttachments?: CreateAttachmentDto[];

    @ApiProperty({
        type: () => [UpdateAttachmentDto],
        description:
            'List of existing attachments to update. Use `id` to identify, and `delete: true` to remove.',
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateAttachmentDto)
    updatedAttachments?: UpdateAttachmentDto[];

    @ApiProperty({
        type: [String],
        description: 'List of attachment IDs to delete.',
        example: ['a1b2c3d4-e5f6-7890-1234-567890abcdef'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    deletedAttachmentIds?: string[];
}
