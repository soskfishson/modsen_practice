import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

export interface JwtRefreshPayload {
    sub: string;
    email: string;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        const jwtRefreshSecret = configService.get<string>('JWT_SECRET_REFRESH');
        if (!jwtRefreshSecret) {
            throw new Error('JWT_SECRET_REFRESH is not defined in environment variables');
        }

        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
            secretOrKey: jwtRefreshSecret,
        });
    }

    async validate(payload: JwtRefreshPayload) {
        const { data } = await this.usersService.find({ id: payload.sub, limit: 1 });
        if (data.length === 0) {
            throw new UnauthorizedException('User not found');
        }
        return data[0];
    }
}
