import {
    Controller,
    Body,
    UseInterceptors,
    ClassSerializerInterceptor,
    UseGuards,
    Post,
    Patch,
    Param,
    ParseUUIDPipe,
    Delete,
    HttpCode,
    HttpStatus,
    Get,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity } from './entities/post.entity';
import { FindPostsQueryDto } from './dto/find-post-query.dto';
import { PaginatedPostResponseDto } from './dto/paginated-post-response.dto';

@ApiTags('posts')
@Controller('posts')
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new post' })
    @ApiResponse({ status: 201, description: 'Post created successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: User) {
        return this.postsService.create({ ...createPostDto, authorId: user.id });
    }

    @Get()
    @ApiOperation({
        summary: 'Find posts with filtering, pagination, sorting, and full-text search',
    })
    @ApiResponse({
        status: 200,
        description: 'Posts retrieved successfully.',
        type: PaginatedPostResponseDto,
    })
    async find(@Query(new ValidationPipe({ transform: true })) query: FindPostsQueryDto) {
        return this.postsService.find(query);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update post (author only)' })
    @ApiResponse({ status: 200, description: 'Post updated successfully.', type: PostEntity })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'Post not found.' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updatePostDto: UpdatePostDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.postsService.update(id, updatePostDto, currentUser);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete post (author only)' })
    @ApiResponse({ status: 204, description: 'Post deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'Post not found.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ): Promise<void> {
        await this.postsService.remove(id, currentUser);
    }
}
