import {
    Controller,
    Post,
    Body,
    UseInterceptors,
    ClassSerializerInterceptor,
    UseGuards,
    Param,
    ParseUUIDPipe,
    Delete,
    HttpCode,
    HttpStatus,
    Get,
    Query,
    ValidationPipe,
    Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserId } from '../common/decorators/user-id.decorator';
import { Comment } from './entities/comment.entity';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { BaseAddReactionDto } from '../reactions/dto/base-add-reaction.dto';
import { FindCommentsQueryDto } from './dto/find-comment-query.dto';
import { PaginatedCommentResponseDto } from './dto/paginated-comment-response.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

@ApiTags('comments')
@Controller('comments')
@UseInterceptors(ClassSerializerInterceptor)
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new comment' })
    @ApiResponse({
        status: 201,
        description: 'Comment created successfully.',
        type: CommentResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async create(
        @Body() createCommentDto: CreateCommentDto,
        @UserId() authorId: string,
    ): Promise<Comment> {
        return this.commentsService.create({ ...createCommentDto, authorId });
    }

    @Get()
    @ApiOperation({
        summary: 'Find comments with filtering, pagination, sorting, and full-text search',
    })
    @ApiResponse({
        status: 200,
        description: 'Comments retrieved successfully.',
        type: PaginatedCommentResponseDto,
    })
    async find(
        @Query(new ValidationPipe({ transform: true })) query: FindCommentsQueryDto,
    ): Promise<PaginatedCommentResponseDto> {
        return this.commentsService.find(query);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update comment (author only)' })
    @ApiResponse({
        status: 200,
        description: 'Comment updated successfully.',
        type: CommentResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'Comment not found.' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateCommentDto: UpdateCommentDto,
        @UserId() currentUserId: string,
    ): Promise<Comment> {
        return this.commentsService.update(id, updateCommentDto, currentUserId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete comment (author only)' })
    @ApiResponse({ status: 204, description: 'Comment deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'Comment not found.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @UserId() currentUserId: string,
    ): Promise<void> {
        await this.commentsService.remove(id, currentUserId);
    }

    @Post('reactions')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Adds reactions for comment' })
    @ApiResponse({ status: 200, description: 'Added reaction successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Comment not found.' })
    async reaction(
        @Body() addReactionDto: BaseAddReactionDto,
        @UserId() currentUserId: string,
    ): Promise<void> {
        await this.commentsService.reaction(currentUserId, addReactionDto);
    }
}
