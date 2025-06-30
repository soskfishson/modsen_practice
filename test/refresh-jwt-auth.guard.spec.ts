import { RefreshJwtAuthGuard } from '../src/auth/guards/refresh-jwt-auth.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';

describe('RefreshJwtAuthGuard', () => {
    let guard: RefreshJwtAuthGuard;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RefreshJwtAuthGuard],
        }).compile();

        guard = module.get<RefreshJwtAuthGuard>(RefreshJwtAuthGuard);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it("should extend AuthGuard('jwt-refresh')", () => {
        expect(guard).toBeInstanceOf(AuthGuard('jwt-refresh'));
    });
});
