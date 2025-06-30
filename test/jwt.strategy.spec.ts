import { JwtStrategy, JwtPayload } from '../src/auth/strageties/jwt.strategy';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../src/users/users.service';
import { User } from '../src/users/entities/user.entity';
import { PaginatedUserResponseDto } from '../src/users/dto/paginated-user-response.dto';

describe('JwtStrategy', () => {
    let jwtStrategy: JwtStrategy;
    let _configService: ConfigService;
    let usersService: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtStrategy,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'JWT_SECRET') return 'test_jwt_secret';
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

        jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
        _configService = module.get<ConfigService>(ConfigService);
        usersService = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(jwtStrategy).toBeDefined();
    });

    describe('validate', () => {
        it('should return a user if valid payload and user exists', async () => {
            const payload: JwtPayload = { sub: '1', email: 'test@example.com' };
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [mockUser],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            } as PaginatedUserResponseDto);

            const result = await jwtStrategy.validate(payload);
            expect(usersService.find).toHaveBeenCalledWith({ id: payload.sub, limit: 1 });
            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            const payload: JwtPayload = { sub: '2', email: 'nonexistent@example.com' };
            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [],
                total: 0,
                page: 1,
                limit: 1,
                totalPages: 0,
            } as PaginatedUserResponseDto);

            await expect(jwtStrategy.validate(payload)).rejects.toThrow(UnauthorizedException);
        });
    });
});
