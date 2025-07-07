import {
    Controller,
    Get,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
    UseInterceptors,
    ClassSerializerInterceptor,
    UseGuards,
    ForbiddenException,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FindUsersQueryDto } from './dto/find-user-query.dto';
import { PaginatedUserResponseDto } from './dto/paginated-user-response.dto';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @ApiOperation({ summary: 'Find users with filtering, pagination, and sorting' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiResponse({
        status: 200,
        description: 'Users retrieved successfully.',
        type: PaginatedUserResponseDto,
    })
    async find(@Query(new ValidationPipe({ transform: true })) query: FindUsersQueryDto) {
        return this.usersService.find(query);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Patch(':id')
    @ApiOperation({ summary: 'Update user (self only)' })
    @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 403 })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
        @UserId() currentUserId: string,
    ) {
        if (currentUserId !== id) {
            throw new ForbiddenException('You are not allowed to update this profile.');
        }
        return this.usersService.update(id, updateUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete(':id')
    @ApiOperation({ summary: 'Delete user (self only)' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async remove(@Param('id', ParseUUIDPipe) id: string, @UserId() currentUserId: string) {
        if (currentUserId !== id) {
            throw new ForbiddenException('You are not allowed to delete this profile.');
        }
        return this.usersService.remove(id);
    }
}
