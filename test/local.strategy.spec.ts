import { LocalStrategy } from '../src/auth/strageties/local.strategy';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { User } from '../src/users/entities/user.entity';

describe('LocalStrategy', () => {
    let localStrategy: LocalStrategy;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LocalStrategy,
                {
                    provide: AuthService,
                    useValue: {
                        validateUser: jest.fn(),
                    },
                },
            ],
        }).compile();

        localStrategy = module.get<LocalStrategy>(LocalStrategy);
        authService = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(localStrategy).toBeDefined();
    });

    describe('validate', () => {
        it('should return a user if validation is successful', async () => {
            const mockUser = { id: '1', email: 'test@example.com' } as User;
            jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);

            const result = await localStrategy.validate('test@example.com', 'password123');
            expect(authService.validateUser).toHaveBeenCalledWith(
                'test@example.com',
                'password123',
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException if validation fails', async () => {
            jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

            await expect(
                localStrategy.validate('wrong@example.com', 'wrongpassword'),
            ).rejects.toThrow(UnauthorizedException);
        });
    });
});
