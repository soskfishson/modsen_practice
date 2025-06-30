import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    UseInterceptors,
    HttpCode,
    ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/login-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt-auth.guard';
import { RefreshResponseDto } from './dto/refresh-response.dto';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({
        status: 201,
        description: 'User registered successfully',
        type: AuthResponseDto,
    })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'User logged in successfully', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 204, description: 'User logged out successfully' })
    @HttpCode(204)
    async logout(@CurrentUser() user: User) {
        await this.authService.logout(user);
    }

    @UseGuards(RefreshJwtAuthGuard)
    @Post('refresh')
    @ApiOperation({ summary: 'Refreshes user`s access token' })
    @ApiResponse({
        status: 200,
        description: 'Token refreshed successfully',
        type: RefreshResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refresh(@Request() req) {
        const user = req.user;
        const refreshToken = req.body.refreshToken;
        return this.authService.refreshAccessToken(user, refreshToken);
    }
}
