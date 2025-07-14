import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCommentDto } from './create-comment.dto';
import { CreateAttachmentDto as BaseCreateAttachmentDto } from '../../attachments/dto/base-create-attachment.dto';
import { UpdateAttachmentDto as BaseUpdateAttachmentDto } from '../../attachments/dto/base-update-attachment.dto';
import { IsArray, IsOptional, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto extends PartialType(
    OmitType(CreateCommentDto, ['attachments'] as const),
) {
    @ApiProperty({
        type: () => [BaseCreateAttachmentDto],
        description: 'List of new attachments to add to the post',
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BaseCreateAttachmentDto)
    newAttachments?: BaseCreateAttachmentDto[];

    @ApiProperty({
        type: () => [BaseUpdateAttachmentDto],
        description:
            'List of existing attachments to update. Use `id` to identify, and `delete: true` to remove.',
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BaseUpdateAttachmentDto)
    updatedAttachments?: BaseUpdateAttachmentDto[];

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
