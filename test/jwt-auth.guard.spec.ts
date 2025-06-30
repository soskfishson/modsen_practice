import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [JwtAuthGuard],
        }).compile();

        guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it("should extend AuthGuard('jwt')", () => {
        expect(guard).toBeInstanceOf(AuthGuard('jwt'));
    });
});
