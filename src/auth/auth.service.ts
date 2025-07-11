import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strageties/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UnauthorizedException } from '@nestjs/common';
import { AuthResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';

@Injectable()
export class AuthService {
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
            throw new UnauthorizedException('User not found');
        }

        const dbUser: User = data[0] as User;

        if (!dbUser.refreshToken || dbUser.refreshToken !== refreshToken) {
            throw new UnauthorizedException('Invalid or revoked refresh token');
        }

        const decodedRefreshToken: any = this.jwtService.decode(refreshToken);

        if (!decodedRefreshToken || !decodedRefreshToken.exp) {
            throw new UnauthorizedException('Invalid refresh token payload');
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);

        if (decodedRefreshToken.exp < currentTimestamp) {
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

        return {
            access_token: accessToken,
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
