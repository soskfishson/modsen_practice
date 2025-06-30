import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class RefreshResponseDto {
    @ApiProperty()
    access_token: string;

    @ApiProperty()
    user: UserResponseDto;
}
