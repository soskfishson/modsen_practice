import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
    @ApiProperty()
    access_token: string;
}
