import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserDto {
    @ApiPropertyOptional({
        description: 'Comma-separated list of fields to return.',
        example: 'id,username,email',
    })
    @IsOptional()
    @IsString()
    fields?: string;
    [key: string]: any;

    @ApiProperty({ example: 'myemail@proton.me' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'myuniqueusername' })
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    username!: string;

    @ApiProperty({ example: 'myPassword123' })
    @IsString()
    @MinLength(8)
    @MaxLength(32)
    password!: string;

    @ApiProperty({ example: 'My cool display name' })
    @IsString()
    @MinLength(1)
    @MaxLength(40)
    displayName!: string;

    @ApiProperty({ example: 'My user description' })
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    userDescription!: string;

    @ApiPropertyOptional({
        description: 'File content encoded in Base64. Optional.',
        example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => {
        if (typeof value === 'string' && value.startsWith('data:') && value.includes(';base64,')) {
            return value.split(',')[1];
        }
        return value;
    })
    profilePicture?: string;
}
