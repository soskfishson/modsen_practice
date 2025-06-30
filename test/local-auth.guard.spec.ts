import { LocalAuthGuard } from '../src/auth/guards/local-auth.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';

describe('LocalAuthGuard', () => {
    let guard: LocalAuthGuard;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LocalAuthGuard],
        }).compile();

        guard = module.get<LocalAuthGuard>(LocalAuthGuard);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it("should extend AuthGuard('local')", () => {
        expect(guard).toBeInstanceOf(AuthGuard('local'));
    });
});
