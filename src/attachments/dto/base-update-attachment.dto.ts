import { PartialType } from '@nestjs/swagger';
import { CreateAttachmentDto } from './base-create-attachment.dto';
import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAttachmentDto extends PartialType(CreateAttachmentDto) {
    @ApiProperty({
        description: 'The ID of the attachment to update',
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        description:
            'Set to true to delete the attachment. fileContent and description will be ignored if true.',
        default: false,
        required: false,
    })
    @IsOptional()
    delete?: boolean;
}
