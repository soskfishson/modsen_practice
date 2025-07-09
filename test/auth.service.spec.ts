import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../src/users/entities/user.entity';
import { RegisterDto } from '../src/auth/dto/register.dto';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;
    let _configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        find: jest.fn().mockImplementation((query) => {
                            const users = [
                                {
                                    id: '1',
                                    email: 'test@example.com',
                                    password: 'hashedPassword',
                                    username: 'testuser',
                                    displayName: 'Test User',
                                    userDescription: 'Test Description',
                                    isActive: true,
                                    registrationDate: new Date(),
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    refreshToken: 'validRefreshToken',
                                },
                            ];
                            const filteredUsers = users.filter((user) => {
                                if (query.email && user.email !== query.email) return false;
                                if (query.id && user.id !== query.id) return false;
                                if (query.username && user.username !== query.username)
                                    return false;
                                return true;
                            });
                            return {
                                data: filteredUsers.slice(0, query.limit || filteredUsers.length),
                                total: filteredUsers.length,
                                page: query.page || 1,
                                limit: query.limit || filteredUsers.length,
                                totalPages: Math.ceil(
                                    filteredUsers.length / (query.limit || filteredUsers.length),
                                ),
                            };
                        }),
                        create: jest.fn(),
                        update: jest.fn(),
                        validatePassword: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'JWT_SECRET') return 'test_jwt_secret';
                            if (key === 'JWT_EXPIRES_IN') return '1h';
                            if (key === 'JWT_SECRET_REFRESH') return 'test_refresh_secret';
                            if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
                            return null;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
        _configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should return user if credentials are valid', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: 'hashedPassword',
                username: 'testuser',
                displayName: 'Test User',
                userDescription: 'Test Description',
                isActive: true,
                registrationDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                refreshToken: 'validRefreshToken',
            } as User;
            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [mockUser],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            });
            jest.spyOn(usersService, 'validatePassword').mockResolvedValueOnce(true);

            const result = await service.validateUser('test@example.com', 'password123');
            const { password: _password, ...expectedResult } = mockUser;
            expect(result).toEqual(expectedResult);
            expect(usersService.find).toHaveBeenCalledWith({
                email: 'test@example.com',
                limit: 1,
                fields: 'id,email,password',
            });
            expect(usersService.validatePassword).toHaveBeenCalledWith(
                'password123',
                'hashedPassword',
            );
        });

        it('should return null if user not found', async () => {
            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [],
                total: 0,
                page: 1,
                limit: 1,
                totalPages: 0,
            });
            const result = await service.validateUser('nonexistent@example.com', 'password123');
            expect(result).toBeNull();
        });

        it('should return null if password is invalid', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: 'hashedPassword',
                username: 'testuser',
                displayName: 'Test User',
                userDescription: 'Test Description',
                isActive: true,
                registrationDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                refreshToken: 'validRefreshToken',
            } as User;
            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [mockUser],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            });
            jest.spyOn(usersService, 'validatePassword').mockResolvedValueOnce(false);

            const result = await service.validateUser('test@example.com', 'wrongpassword');
            expect(result).toBeNull();
        });
    });

    describe('register', () => {
        it('should register a new user and return auth response', async () => {
            const registerDto: RegisterDto = {
                email: 'newuser@example.com',
                username: 'newuser',
                password: 'password123',
                displayName: 'New User',
                userDescription: 'A new user',
            };
            const createdUser = { id: '2', ...registerDto } as User;
            const authResponse = {
                access_token: 'access',
                refresh_token: 'refresh',
                user: createdUser,
            };

            jest.spyOn(usersService, 'create').mockResolvedValueOnce(createdUser);
            jest.spyOn<any, any>(service, 'generateAuthResponse').mockResolvedValueOnce(
                authResponse,
            );

            const result = await service.register(registerDto);
            expect(usersService.create).toHaveBeenCalledWith(registerDto);
            expect(result).toEqual(authResponse);
        });
    });

    describe('login', () => {
        it('should login a user and return auth response', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            const authResponse = {
                access_token: 'access',
                refresh_token: 'refresh',
                user: mockUser,
            };

            jest.spyOn(usersService, 'update').mockResolvedValueOnce(mockUser);
            jest.spyOn<any, any>(service, 'generateAuthResponse').mockResolvedValueOnce(
                authResponse,
            );

            const result = await service.login(mockUser);
            expect(usersService.update).toHaveBeenCalledWith(mockUser.id, { isActive: true });
            expect(result).toEqual(authResponse);
        });
    });

    describe('logout', () => {
        it('should logout a user', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            jest.spyOn(usersService, 'update').mockResolvedValueOnce(mockUser);

            await service.logout(mockUser);
            expect(usersService.update).toHaveBeenCalledWith(mockUser.id, {
                isActive: false,
                refreshToken: null,
            });
        });
    });

    describe('refreshAccessToken', () => {
        it('should refresh access token if valid refresh token', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            const mockDbUser = { ...mockUser, refreshToken: 'validRefreshToken' } as User;
            const mockJwtPayload = { sub: mockUser.id, email: mockUser.email };

            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [mockDbUser],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            });
            jest.spyOn(jwtService, 'sign').mockReturnValueOnce('newAccessToken');

            const result = await service.refreshAccessToken(mockJwtPayload, 'validRefreshToken');
            expect(usersService.find).toHaveBeenCalledWith({
                id: mockUser.id,
                limit: 1,
                fields: 'id,refreshToken',
            });
            expect(jwtService.sign).toHaveBeenCalledWith(
                { sub: mockUser.id, email: mockUser.email },
                {
                    secret: 'test_jwt_secret',
                    expiresIn: '1h',
                },
            );
            expect(result).toEqual({
                access_token: 'newAccessToken',
            });
        });

        it('should throw UnauthorizedException if user not found', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            const mockJwtPayload = { sub: mockUser.id, email: mockUser.email };
            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [],
                total: 0,
                page: 1,
                limit: 1,
                totalPages: 0,
            });

            await expect(service.refreshAccessToken(mockJwtPayload, 'someToken')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException if refresh token is invalid', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            const mockDbUser = { ...mockUser, refreshToken: 'invalidRefreshToken' } as User;
            const mockJwtPayload = { sub: mockUser.id, email: mockUser.email };
            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [mockDbUser],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            });

            await expect(service.refreshAccessToken(mockJwtPayload, 'wrongToken')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException if refresh token is null', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            const mockDbUser = { ...mockUser, refreshToken: null } as unknown as User;
            const mockJwtPayload = { sub: mockUser.id, email: mockUser.email };
            jest.spyOn(usersService, 'find').mockResolvedValueOnce({
                data: [mockDbUser],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            });

            await expect(service.refreshAccessToken(mockJwtPayload, 'someToken')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
