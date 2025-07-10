import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from '../src/comments/comments.controller';
import { CommentsService } from '../src/comments/comments.service';
import { CreateCommentDto } from '../src/comments/dto/create-comment.dto';
import { UpdateCommentDto } from '../src/comments/dto/update-comment.dto';
import { Comment } from '../src/comments/entities/comment.entity';
import { User } from '../src/users/entities/user.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FindCommentsQueryDto } from '../src/comments/dto/find-comment-query.dto';
import { PaginatedCommentResponseDto } from '../src/comments/dto/paginated-comment-response.dto';
import { BaseAddReactionDto } from '../src/reactions/dto/base-add-reaction.dto';
import { ReactionType } from '../src/reactions/interfaces/reaction.interface';

describe('CommentsController', () => {
    let controller: CommentsController;
    let service: CommentsService;

    const mockCommentsService = {
        create: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        reaction: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CommentsController],
            providers: [
                {
                    provide: CommentsService,
                    useValue: mockCommentsService,
                },
            ],
        }).compile();

        controller = module.get<CommentsController>(CommentsController);
        service = module.get<CommentsService>(CommentsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a new comment', async () => {
            const createCommentDto: CreateCommentDto = {
                content: 'Test Comment',
                postId: 'post-uuid',
            };
            const user = { id: 'user-uuid' } as User;
            const expectedComment = {
                id: 'comment-uuid',
                content: createCommentDto.content,
                authorId: user.id,
                author: user,
                postId: createCommentDto.postId,
                likesCount: 0,
                dislikesCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                attachments: [],
                reactions: [],
                replies: [],
            } as unknown as Comment;

            mockCommentsService.create.mockResolvedValue(expectedComment);

            const result = await controller.create(createCommentDto, user.id);

            expect(service.create).toHaveBeenCalledWith({
                ...createCommentDto,
                authorId: user.id,
            });
            expect(result).toEqual(expectedComment);
        });
    });

    describe('find', () => {
        it('should return paginated comments', async () => {
            const queryDto: FindCommentsQueryDto = { page: 1, limit: 10 };
            const mockPaginatedResponse: PaginatedCommentResponseDto = {
                data: [
                    {
                        id: 'comment-uuid-1',
                        content: 'Comment 1',
                        authorId: 'author-uuid-1',
                        author: { id: 'author-uuid-1', username: 'user1' } as User,
                        postId: 'post-uuid-1',
                        likesCount: 0,
                        dislikesCount: 0,
                        attachments: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            };
            mockCommentsService.find.mockResolvedValue(mockPaginatedResponse);

            const result = await controller.find(queryDto);

            expect(service.find).toHaveBeenCalledWith(queryDto);
            expect(result).toEqual(mockPaginatedResponse);
        });
    });

    describe('update', () => {
        const mockUser = { id: 'author-uuid' } as User;
        const mockComment = {
            id: 'comment-uuid',
            content: 'Original Content',
            author: mockUser,
            authorId: mockUser.id,
            likesCount: 0,
            dislikesCount: 0,
            attachments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            reactions: [],
            replies: [],
        } as unknown as Comment;

        it('should update a comment', async () => {
            const updateCommentDto: UpdateCommentDto = { content: 'Updated Content' };
            const updatedComment = { ...mockComment, ...updateCommentDto } as Comment;

            mockCommentsService.update.mockResolvedValue(updatedComment);

            const result = await controller.update(mockComment.id, updateCommentDto, mockUser.id);

            expect(service.update).toHaveBeenCalledWith(
                mockComment.id,
                updateCommentDto,
                mockUser.id,
            );
            expect(result).toEqual(updatedComment);
        });

        it('should throw ForbiddenException if user is not the author', async () => {
            const anotherUser = { id: 'another-user-uuid' } as User;
            const updateCommentDto: UpdateCommentDto = { content: 'Updated Content' };

            mockCommentsService.update.mockRejectedValue(new ForbiddenException());

            await expect(
                controller.update(mockComment.id, updateCommentDto, anotherUser.id),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException if comment not found', async () => {
            const updateCommentDto: UpdateCommentDto = { content: 'Updated Content' };

            mockCommentsService.update.mockRejectedValue(new NotFoundException());

            await expect(
                controller.update('non-existent-id', updateCommentDto, mockUser.id),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        const mockUser = { id: 'author-uuid' } as User;
        const commentId = 'comment-uuid';

        it('should remove a comment', async () => {
            mockCommentsService.remove.mockResolvedValue(undefined);

            await controller.remove(commentId, mockUser.id);

            expect(service.remove).toHaveBeenCalledWith(commentId, mockUser.id);
        });

        it('should throw ForbiddenException if user is not the author', async () => {
            const anotherUser = { id: 'another-user-uuid' } as User;

            mockCommentsService.remove.mockRejectedValue(new ForbiddenException());

            await expect(controller.remove(commentId, anotherUser.id)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw NotFoundException if comment not found', async () => {
            mockCommentsService.remove.mockRejectedValue(new NotFoundException());

            await expect(controller.remove('non-existent-id', mockUser.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('reaction', () => {
        const mockUser = { id: 'user-uuid' } as User;
        const mockCommentId = 'comment-uuid';

        it('should add a reaction to a comment', async () => {
            const addReactionDto: BaseAddReactionDto = {
                parentId: mockCommentId,
                type: ReactionType.LIKE,
            };
            mockCommentsService.reaction.mockResolvedValue(undefined);

            await controller.reaction(addReactionDto, mockUser.id);

            expect(service.reaction).toHaveBeenCalledWith(mockUser.id, addReactionDto);
        });

        it('should throw NotFoundException if comment not found', async () => {
            const addReactionDto: BaseAddReactionDto = {
                parentId: 'non-existent-id',
                type: ReactionType.LIKE,
            };
            mockCommentsService.reaction.mockRejectedValue(new NotFoundException());

            await expect(controller.reaction(addReactionDto, mockUser.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
