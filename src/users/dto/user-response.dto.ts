import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    email!: string;

    @ApiProperty()
    username!: string;

    @ApiProperty()
    displayName!: string;

    @ApiProperty()
    userDescription!: string;

    @ApiProperty()
    isActive!: boolean;

    @ApiProperty()
    registrationDate!: Date;

    @ApiProperty({
        nullable: true,
        description: 'URL to the user profile picture. Can be null.',
    })
    profilePictureUrl!: string | null;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}
