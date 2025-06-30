import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'myemail@proton.me' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'mypassword123' })
    @IsString()
    @MinLength(8)
    @MaxLength(32)
    password: string;
}
