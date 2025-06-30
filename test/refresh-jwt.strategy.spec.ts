import {
    RefreshTokenStrategy,
    JwtRefreshPayload,
} from '../src/auth/strageties/refresh-jwt.strategy';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../src/users/users.service';
import { User } from '../src/users/entities/user.entity';
import { PaginatedUserResponseDto } from '../src/users/dto/paginated-user-response.dto';

describe('RefreshTokenStrategy', () => {
    let refreshTokenStrategy: RefreshTokenStrategy;
    let _configService: ConfigService;
    let usersService: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RefreshTokenStrategy,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'JWT_SECRET_REFRESH') return 'test_refresh_secret';
                            return null;
                        }),
                    },
                },
                {
                    provide: UsersService,
                    useValue: {
                        find: jest.fn(),
                    },
                },
            ],
        }).compile();

        refreshTokenStrategy = module.get<RefreshTokenStrategy>(RefreshTokenStrategy);
        _configService = module.get<ConfigService>(ConfigService);
        usersService = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(refreshTokenStrategy).toBeDefined();
    });

    describe('validate', () => {
        it('should return a user if valid payload and user exists', async () => {
            const payload: JwtRefreshPayload = { sub: '1', email: 'test@example.com' };
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [mockUser],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            } as PaginatedUserResponseDto);

            const result = await refreshTokenStrategy.validate(payload);
            expect(usersService.find).toHaveBeenCalledWith({ id: payload.sub, limit: 1 });
            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            const payload: JwtRefreshPayload = { sub: '2', email: 'nonexistent@example.com' };
            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [],
                total: 0,
                page: 1,
                limit: 1,
                totalPages: 0,
            } as PaginatedUserResponseDto);

            await expect(refreshTokenStrategy.validate(payload)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
