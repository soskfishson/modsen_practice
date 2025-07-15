import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strageties/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { AuthResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async validateUser(email: string, password: string): Promise<User | null> {
        const { data } = await this.usersService.find({
            email,
            limit: 1,
            fields: 'id,email,password',
        });

        if (data.length === 0) {
            return null;
        }

        const user: User = data[0] as User;

        if (
            user &&
            user.password &&
            (await this.usersService.validatePassword(password, user.password))
        ) {
            const { password: _password, ...result } = user;
            return result as User;
        }
        return null;
    }

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        const user = await this.usersService.create(registerDto);
        return await this.generateAuthResponse(user);
    }

    async login(user: User): Promise<AuthResponseDto> {
        await this.usersService.update(user.id, { isActive: true } as UpdateUserDto);
        return await this.generateAuthResponse(user);
    }

    async logout(user: User) {
        if (!user.isActive && !user.refreshToken) {
            throw new UnauthorizedException();
        }
        await this.usersService.update(user.id, {
            isActive: false,
            refreshToken: null,
        } as UpdateUserDto);
    }

    async refreshAccessToken(user: JwtPayload, refreshToken: string): Promise<RefreshResponseDto> {
        const { data } = await this.usersService.find({
            id: user.sub,
            limit: 1,
            fields: 'id,refreshToken',
        });

        if (data.length === 0) {
            this.logger.warn(`RefreshAccessToken: User with sub ${user.sub} not found.`);
            throw new UnauthorizedException('User not found');
        }

        const dbUser: User = data[0] as User;

        this.logger.debug(`RefreshAccessToken: Client refresh token: ${refreshToken}`);
        this.logger.debug(`RefreshAccessToken: DB refresh token: ${dbUser.refreshToken}`);

        if (!dbUser.refreshToken || dbUser.refreshToken !== refreshToken) {
            this.logger.warn('RefreshAccessToken: Invalid or revoked refresh token mismatch.');
            throw new UnauthorizedException('Invalid or revoked refresh token');
        }

        try {
            await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_SECRET_REFRESH'),
            });
        } catch (error: any) {
            this.logger.warn(`RefreshAccessToken: JWT verification failed: ${error.message}`);
            await this.usersService.update(user.sub, {
                refreshToken: null,
                isActive: false,
            } as UpdateUserDto);
            if (error instanceof TokenExpiredError) {
                throw new UnauthorizedException('Refresh token has expired');
            }
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const decodedRefreshToken: any = this.jwtService.decode(refreshToken);

        if (!decodedRefreshToken || !decodedRefreshToken.exp) {
            this.logger.warn('RefreshAccessToken: Invalid refresh token payload.');
            throw new UnauthorizedException('Invalid refresh token payload');
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);

        if (decodedRefreshToken.exp < currentTimestamp) {
            this.logger.warn('RefreshAccessToken: Refresh token has expired based on payload.');
            await this.usersService.update(user.sub, {
                refreshToken: null,
                isActive: false,
            } as UpdateUserDto);
            throw new UnauthorizedException('Refresh token has expired');
        }

        const payload: JwtPayload = { sub: user.sub, email: user.email };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
        });

        const newRefreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET_REFRESH'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
        });

        await this.usersService.update(user.sub, {
            refreshToken: newRefreshToken,
        } as UpdateUserDto);

        return {
            access_token: accessToken,
            refresh_token: newRefreshToken,
        };
    }

    private async generateAuthResponse(user: User) {
        const payload: JwtPayload = { sub: user.id, email: user.email };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET_REFRESH'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
        });
        await this.usersService.update(user.id, { refreshToken: refreshToken } as UpdateUserDto);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
}
