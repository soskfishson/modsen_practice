import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../src/posts/posts.controller';
import { PostsService } from '../src/posts/posts.service';
import { CreatePostDto } from '../src/posts/dto/create-post.dto';
import { User } from '../src/users/entities/user.entity';
import { Post } from '../src/posts/entities/post.entity';
import { UpdatePostDto } from '../src/posts/dto/update-post.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FindPostsQueryDto } from '../src/posts/dto/find-post-query.dto';
import { PaginatedPostResponseDto } from '../src/posts/dto/paginated-post-response.dto';

describe('PostsController', () => {
    let controller: PostsController;
    let service: PostsService;

    const mockPostsService = {
        create: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PostsController],
            providers: [
                {
                    provide: PostsService,
                    useValue: mockPostsService,
                },
            ],
        }).compile();

        controller = module.get<PostsController>(PostsController);
        service = module.get<PostsService>(PostsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a new post', async () => {
            const createPostDto: CreatePostDto = {
                postTitle: 'Test Post',
                content: 'Test Content',
            };
            const user = { id: 'user-uuid' } as User;
            const expectedPost = {
                id: 'post-uuid',
                postTitle: createPostDto.postTitle,
                content: createPostDto.content,
                authorId: user.id,
                author: user,
                viewsCount: 0,
                likesCount: 0,
                dislikesCount: 0,
                commentsCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                attachments: [],
                reactions: [],
            } as Post;

            mockPostsService.create.mockResolvedValue(expectedPost);

            const result = await controller.create(createPostDto, user);

            expect(service.create).toHaveBeenCalledWith({
                ...createPostDto,
                authorId: user.id,
            });
            expect(result).toEqual(expectedPost);
        });
    });

    describe('find', () => {
        it('should return paginated posts', async () => {
            const queryDto: FindPostsQueryDto = { page: 1, limit: 10 };
            const mockPaginatedResponse: PaginatedPostResponseDto = {
                data: [
                    {
                        id: 'post-uuid-1',
                        postTitle: 'Test Post 1',
                        content: 'Content 1',
                        authorId: 'author-uuid-1',
                        author: { id: 'author-uuid-1', username: 'user1' } as User,
                        viewsCount: 0,
                        likesCount: 0,
                        dislikesCount: 0,
                        commentsCount: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        attachments: [],
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            };
            mockPostsService.find.mockResolvedValue(mockPaginatedResponse);

            const result = await controller.find(queryDto);

            expect(service.find).toHaveBeenCalledWith(queryDto);
            expect(result).toEqual(mockPaginatedResponse);
        });
    });

    describe('update', () => {
        const mockUser = { id: 'author-uuid' } as User;
        const mockPost = {
            id: 'post-uuid',
            postTitle: 'Original Title',
            content: 'Original Content',
            author: mockUser,
            authorId: mockUser.id,
            viewsCount: 0,
            likesCount: 0,
            dislikesCount: 0,
            commentsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            attachments: [],
            reactions: [],
        } as Post;

        it('should update a post', async () => {
            const updatePostDto: UpdatePostDto = { postTitle: 'Updated Title' };
            const updatedPost = { ...mockPost, ...updatePostDto } as Post;

            mockPostsService.update.mockResolvedValue(updatedPost);

            const result = await controller.update(mockPost.id, updatePostDto, mockUser);

            expect(service.update).toHaveBeenCalledWith(mockPost.id, updatePostDto, mockUser);
            expect(result).toEqual(updatedPost);
        });

        it('should throw ForbiddenException if user is not the author', async () => {
            const anotherUser = { id: 'another-user-uuid' } as User;
            const updatePostDto: UpdatePostDto = { postTitle: 'Updated Title' };

            mockPostsService.update.mockRejectedValue(new ForbiddenException());

            await expect(controller.update(mockPost.id, updatePostDto, anotherUser)).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException if post not found', async () => {
            const updatePostDto: UpdatePostDto = { postTitle: 'Updated Title' };

            mockPostsService.update.mockRejectedValue(new NotFoundException());

            await expect(controller.update('non-existent-id', updatePostDto, mockUser)).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        const mockUser = { id: 'author-uuid' } as User;
        const postId = 'post-uuid';

        it('should remove a post', async () => {
            mockPostsService.remove.mockResolvedValue(undefined);

            await controller.remove(postId, mockUser);

            expect(service.remove).toHaveBeenCalledWith(postId, mockUser);
        });

        it('should throw ForbiddenException if user is not the author', async () => {
            const anotherUser = { id: 'another-user-uuid' } as User;

            mockPostsService.remove.mockRejectedValue(new ForbiddenException());

            await expect(controller.remove(postId, anotherUser)).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException if post not found', async () => {
            mockPostsService.remove.mockRejectedValue(new NotFoundException());

            await expect(controller.remove('non-existent-id', mockUser)).rejects.toThrow(NotFoundException);
        });
    });
}); 