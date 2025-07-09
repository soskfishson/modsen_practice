import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAttachmentDto {
    @ApiProperty({
        description: 'File content encoded in Base64',
        example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
    })
    @Transform(({ value }) => {
        if (typeof value === 'string' && value.startsWith('data:') && value.includes(';base64,')) {
            return value.split(',')[1];
        }
        return value;
    })
    @IsString()
    fileContent: string;

    @ApiProperty({
        description: 'Optional description for the attachment (alt text)',
        example: 'A beautiful sunset over the ocean.',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    description?: string;
}
