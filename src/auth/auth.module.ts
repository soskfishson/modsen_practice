import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strageties/jwt.strategy';
import { LocalStrategy } from './strageties/local.strategy';
import { RefreshTokenStrategy } from './strageties/refresh-jwt.strategy';

@Module({
    imports: [UsersModule, PassportModule, JwtModule.register({}), ConfigModule],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, LocalStrategy, RefreshTokenStrategy],
    exports: [AuthService],
})
export class AuthModule {}
