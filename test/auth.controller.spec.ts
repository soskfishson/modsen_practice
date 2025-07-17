import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { AuthResponseDto } from '../src/auth/dto/login-response.dto';
import { User } from '../src/users/entities/user.entity';
import { UserResponseDto } from '../src/users/dto/user-response.dto';
import { RefreshResponseDto } from '../src/auth/dto/refresh-response.dto';

interface MockAuthService {
    register: (registerDto: RegisterDto) => Promise<AuthResponseDto>;
    login: (user: User) => Promise<AuthResponseDto>;
    logout: (user: User) => Promise<void>;
    refreshAccessToken: (user: User, refreshToken: string) => Promise<RefreshResponseDto>;
}

describe('AuthController', () => {
    let controller: AuthController;
    let authService: MockAuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        register: jest.fn(),
                        login: jest.fn(),
                        logout: jest.fn(),
                        refreshAccessToken: jest.fn(),
                    } as MockAuthService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService) as unknown as MockAuthService;
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('register', () => {
        it('should register a user', async () => {
            const registerDto: RegisterDto = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
                displayName: 'Test User',
                userDescription: 'A test user',
                profilePicture: undefined,
            };
            const _mockUserResponseDto: UserResponseDto = {
                id: '1',
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'Test User',
                userDescription: 'A test user',
                isActive: true,
                registrationDate: new Date(),
                profilePictureUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const mockAuthResponse: AuthResponseDto = {
                access_token: 'some_access_token',
                refresh_token: 'some_refresh_token',
            };

            jest.spyOn(authService, 'register').mockResolvedValue(mockAuthResponse);

            const result = await controller.register(registerDto);
            expect(authService.register).toHaveBeenCalledWith(registerDto);
            expect(result).toEqual(mockAuthResponse);
        });
    });

    describe('login', () => {
        it('should login a user', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            const mockAuthResponse: AuthResponseDto = {
                access_token: 'some_access_token',
                refresh_token: 'some_refresh_token',
            };

            jest.spyOn(authService, 'login').mockResolvedValue(mockAuthResponse);

            const req = { user: mockUser };
            const result = await controller.login(req);
            expect(authService.login).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockAuthResponse);
        });
    });

    describe('logout', () => {
        it('should logout a user', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

            await controller.logout(mockUser);
            expect(authService.logout).toHaveBeenCalledWith(mockUser);
        });
    });

    describe('refresh', () => {
        it('should refresh access token', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            const refreshToken = 'some_refresh_token';

            const mockAuthResponse: RefreshResponseDto = {
                access_token: 'new_access_token',
                refresh_token: 'new_refresh_token',
            };
            jest.spyOn(authService, 'refreshAccessToken').mockResolvedValue(mockAuthResponse);

            const result = await controller.refresh(mockUser, refreshToken);

            expect(authService.refreshAccessToken).toHaveBeenCalledWith(
                { sub: mockUser.id, email: mockUser.email },
                refreshToken,
            );
            expect(result).toEqual(mockAuthResponse);
        });
    });
});
