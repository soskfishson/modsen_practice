import { User } from '../entities/user.entity';

export const USER_VALID_FIELDS: (keyof User)[] = [
    'id',
    'email',
    'username',
    'displayName',
    'registrationDate',
    'userDescription',
    'isActive',
    'createdAt',
    'updatedAt',
    'password',
    'refreshToken',
    'profilePictureUrl',
];

export const USER_PUBLIC_FIELDS: (keyof User)[] = [
    'id',
    'email',
    'username',
    'displayName',
    'registrationDate',
    'userDescription',
    'isActive',
    'createdAt',
    'updatedAt',
];
