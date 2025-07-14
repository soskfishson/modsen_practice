import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PostsService } from '../src/posts/posts.service';
import { Post } from '../src/posts/entities/post.entity';
import { PostAttachment } from '../src/attachments/entities/post-attachment.entity';
import { CreatePostDto } from '../src/posts/dto/create-post.dto';
import {
    NotFoundException,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../src/users/entities/user.entity';
import { UpdatePostDto } from '../src/posts/dto/update-post.dto';
import { FindPostsQueryDto } from '../src/posts/dto/find-post-query.dto';
import { ReactionType } from '../src/reactions/interfaces/reaction.interface';
import { BaseAddReactionDto } from '../src/reactions/dto/base-add-reaction.dto';
import { AttachmentsService } from '../src/attachments/attachments.service';
import { ReactionsService } from '../src/reactions/reactions.service';

describe('PostsService', () => {
    let service: PostsService;
    let _postsRepository: Repository<Post>;
    let _attachmentRepository: Repository<PostAttachment>;
    let _dataSource: DataSource;
    let _attachmentsService: AttachmentsService;
    let _reactionsService: ReactionsService;

    const mockPostRepository = {
        create: jest.fn() as jest.Mock<any, any>,
        save: jest.fn() as jest.Mock<any, any>,
        findOne: jest.fn() as jest.Mock<any, any>,
        remove: jest.fn() as jest.Mock<any, any>,
        createQueryBuilder: jest.fn() as jest.Mock<any, any>,
        increment: jest.fn() as jest.Mock<any, any>,
        decrement: jest.fn() as jest.Mock<any, any>,
    };

    const mockAttachmentRepository = {
        create: jest.fn() as jest.Mock<any, any>,
        save: jest.fn() as jest.Mock<any, any>,
        delete: jest.fn() as jest.Mock<any, any>,
        findOne: jest.fn() as jest.Mock<any, any>,
        find: jest.fn() as jest.Mock<any, any>,
    };

    const mockReactionRepository = {
        create: jest.fn() as jest.Mock<any, any>,
        save: jest.fn() as jest.Mock<any, any>,
        findOne: jest.fn() as jest.Mock<any, any>,
        remove: jest.fn() as jest.Mock<any, any>,
    };

    const mockAttachmentsService = {
        createAttachment: jest.fn() as jest.Mock<any, any>,
        updateAttachment: jest.fn() as jest.Mock<any, any>,
        deleteAttachment: jest.fn() as jest.Mock<any, any>,
        findAttachmentsByParentId: jest.fn() as jest.Mock<any, any>,
    };

    const mockReactionsService = {
        addOrUpdateReaction: jest.fn() as jest.Mock<any, any>,
        removeAllReactionsForParent: jest.fn() as jest.Mock<any, any>,
    };

    const mockTransactionalEntityManager = {
        save: jest.fn() as jest.Mock<any, any>,
        create: jest.fn() as jest.Mock<any, any>,
        findOne: jest.fn() as jest.Mock<any, any>,
        delete: jest.fn() as jest.Mock<any, any>,
        remove: jest.fn() as jest.Mock<any, any>,
        find: jest.fn() as jest.Mock<any, any>,
    };

    const mockDataSource = {
        transaction: jest.fn(async (callback) => {
            try {
                return await callback(mockTransactionalEntityManager);
            } catch (error) {
                throw error;
            }
        }) as jest.Mock<any, any>,
    };

    let mockQueryBuilder: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        mockTransactionalEntityManager.save.mockClear();
        mockTransactionalEntityManager.create.mockClear();
        mockTransactionalEntityManager.findOne.mockClear();
        mockTransactionalEntityManager.delete.mockClear();
        mockTransactionalEntityManager.remove.mockClear();
        mockTransactionalEntityManager.find.mockClear();

        mockPostRepository.create.mockClear();
        mockPostRepository.save.mockClear();
        mockPostRepository.findOne.mockClear();
        mockPostRepository.remove.mockClear();
        mockPostRepository.createQueryBuilder.mockClear();
        mockPostRepository.increment.mockClear();
        mockPostRepository.decrement.mockClear();

        mockAttachmentRepository.create.mockClear();
        mockAttachmentRepository.save.mockClear();
        mockAttachmentRepository.delete.mockClear();
        mockAttachmentRepository.findOne.mockClear();
        mockAttachmentRepository.find.mockClear();

        mockReactionRepository.create.mockClear();
        mockReactionRepository.save.mockClear();
        mockReactionRepository.findOne.mockClear();
        mockReactionRepository.remove.mockClear();

        mockAttachmentsService.createAttachment.mockClear();
        mockAttachmentsService.updateAttachment.mockClear();
        mockAttachmentsService.deleteAttachment.mockClear();
        mockAttachmentsService.findAttachmentsByParentId.mockClear();

        mockReactionsService.addOrUpdateReaction.mockClear();
        mockReactionsService.removeAllReactionsForParent.mockClear();

        mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis() as jest.Mock<any, any>,
            select: jest.fn().mockReturnThis() as jest.Mock<any, any>,
            addSelect: jest.fn().mockReturnThis() as jest.Mock<any, any>,
            andWhere: jest.fn().mockReturnThis() as jest.Mock<any, any>,
            orderBy: jest.fn().mockReturnThis() as jest.Mock<any, any>,
            skip: jest.fn().mockReturnThis() as jest.Mock<any, any>,
            take: jest.fn().mockReturnThis() as jest.Mock<any, any>,
            getManyAndCount: jest.fn() as jest.Mock<any, any>,
        };
        mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostsService,
                { provide: getRepositoryToken(Post), useValue: mockPostRepository },
                { provide: getRepositoryToken(PostAttachment), useValue: mockAttachmentRepository },
                { provide: AttachmentsService, useValue: mockAttachmentsService },
                { provide: DataSource, useValue: mockDataSource },
                { provide: ReactionsService, useValue: mockReactionsService },
            ],
        }).compile();

        service = module.get<PostsService>(PostsService);
        _postsRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
        _attachmentRepository = module.get<Repository<PostAttachment>>(
            getRepositoryToken(PostAttachment),
        );
        _dataSource = module.get<DataSource>(DataSource);
        _attachmentsService = module.get<AttachmentsService>(AttachmentsService);
        _reactionsService = module.get<ReactionsService>(ReactionsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new post with attachments', async () => {
            const createPostDto: CreatePostDto = {
                postTitle: 'Test Post',
                content: 'This is a test post.',
                attachments: [
                    { fileContent: 'base64image1', description: 'Image 1' },
                    { fileContent: 'base64image2', description: 'Image 2' },
                ],
            };
            const authorId = 'author-uuid';
            const mockSavedPost = {
                id: 'post-uuid',
                postTitle: 'Test Post',
                content: 'This is a test post.',
                authorId: authorId,
                viewsCount: 0,
                likesCount: 0,
                dislikesCount: 0,
                commentsCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                attachments: [],
                author: { id: authorId } as User,
                reactions: [],
                comments: [],
            } as unknown as Post;

            mockPostRepository.create.mockReturnValue(mockSavedPost);
            mockTransactionalEntityManager.save.mockResolvedValue(mockSavedPost);
            mockAttachmentsService.createAttachment.mockResolvedValueOnce({ id: 'att-uuid-1' });
            mockAttachmentsService.createAttachment.mockResolvedValueOnce({ id: 'att-uuid-2' });

            const result = await service.create({ ...createPostDto, authorId });

            expect(mockPostRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    postTitle: createPostDto.postTitle,
                    author: { id: authorId },
                }),
            );
            expect(mockTransactionalEntityManager.save).toHaveBeenCalled();
            expect(mockAttachmentsService.createAttachment).toHaveBeenCalledTimes(2);
            expect(mockAttachmentsService.createAttachment).toHaveBeenCalledWith(
                createPostDto.attachments![0],
                mockSavedPost.id,
                'post',
                mockTransactionalEntityManager,
            );
            expect(mockAttachmentsService.createAttachment).toHaveBeenCalledWith(
                createPostDto.attachments![1],
                mockSavedPost.id,
                'post',
                mockTransactionalEntityManager,
            );
            expect(result).toEqual(mockSavedPost);
        });

        it('should create a new post without attachments', async () => {
            const createPostDto: CreatePostDto = {
                postTitle: 'Test Post Without Attachments',
                content: 'This is a test post without attachments.',
                attachments: [],
            };
            const authorId = 'author-uuid';
            const mockSavedPost = {
                id: 'post-uuid-no-attachments',
                postTitle: 'Test Post Without Attachments',
                content: 'This is a test post without attachments.',
                authorId: authorId,
                viewsCount: 0,
                likesCount: 0,
                dislikesCount: 0,
                commentsCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                attachments: [],
                author: { id: authorId } as User,
                reactions: [],
                comments: [],
            } as unknown as Post;

            mockPostRepository.create.mockReturnValue(mockSavedPost);
            mockTransactionalEntityManager.save.mockResolvedValue(mockSavedPost);
            mockAttachmentsService.createAttachment.mockClear();

            const result = await service.create({ ...createPostDto, authorId });

            expect(mockPostRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    postTitle: createPostDto.postTitle,
                    author: { id: authorId },
                }),
            );
            expect(mockTransactionalEntityManager.save).toHaveBeenCalled();
            expect(mockAttachmentsService.createAttachment).not.toHaveBeenCalled();
            expect(result).toEqual(mockSavedPost);
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
            attachments: [],
            viewsCount: 0,
            likesCount: 0,
            dislikesCount: 0,
            commentsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            reactions: [],
            comments: [],
        } as unknown as Post;

        it('should update a post successfully without attachment changes', async () => {
            const updatePostDto: UpdatePostDto = {
                postTitle: 'Updated Title',
                content: 'Updated Content',
            };

            mockTransactionalEntityManager.findOne.mockResolvedValue(mockPost);
            mockTransactionalEntityManager.save.mockResolvedValue({
                ...mockPost,
                ...updatePostDto,
            });
            mockAttachmentsService.findAttachmentsByParentId.mockResolvedValue([]);

            const result = await service.update(mockPost.id, updatePostDto, mockUser.id);

            expect(mockDataSource.transaction).toHaveBeenCalled();
            expect(result.postTitle).toEqual(updatePostDto.postTitle);
            expect(result.content).toEqual(updatePostDto.content);
        });

        it('should update a post with new attachments', async () => {
            const newAttachmentDto = { fileContent: 'base64newimage', description: 'New Image' };
            const updatePostDto: UpdatePostDto = {
                newAttachments: [newAttachmentDto],
            };
            const savedAttachment = {
                id: 'new-att-id',
                url: 'newurl',
                publicId: 'newpid',
                description: 'New Image',
            } as PostAttachment;

            mockTransactionalEntityManager.findOne.mockResolvedValue(mockPost);
            mockAttachmentsService.createAttachment.mockResolvedValueOnce(savedAttachment);
            mockAttachmentsService.findAttachmentsByParentId.mockResolvedValue([savedAttachment]);
            mockTransactionalEntityManager.save.mockResolvedValue(mockPost);

            const result = await service.update(mockPost.id, updatePostDto, mockUser.id);

            expect(mockDataSource.transaction).toHaveBeenCalled();
            expect(mockAttachmentsService.createAttachment).toHaveBeenCalledWith(
                newAttachmentDto,
                mockPost.id,
                'post',
                mockTransactionalEntityManager,
            );
            expect(result.attachments).toEqual([savedAttachment]);
        });

        it('should update a post with updated attachments', async () => {
            const existingAttachment = {
                id: 'att-id-1',
                url: 'url1',
                publicId: 'pid1',
                description: 'Old Desc',
            } as PostAttachment;
            const postWithAttachments = { ...mockPost, attachments: [existingAttachment] };
            const updatedAttachmentDto = { id: 'att-id-1', description: 'Updated Desc' };
            const updatePostDto: UpdatePostDto = {
                updatedAttachments: [updatedAttachmentDto],
            };
            const savedUpdatedAttachment = {
                ...existingAttachment,
                ...updatedAttachmentDto,
            } as PostAttachment;

            mockTransactionalEntityManager.findOne.mockResolvedValue(postWithAttachments);
            mockAttachmentsService.updateAttachment.mockResolvedValueOnce(savedUpdatedAttachment);
            mockAttachmentsService.findAttachmentsByParentId.mockResolvedValue([
                savedUpdatedAttachment,
            ]);
            mockTransactionalEntityManager.save.mockResolvedValue(postWithAttachments);

            const result = await service.update(mockPost.id, updatePostDto, mockUser.id);

            expect(mockDataSource.transaction).toHaveBeenCalled();
            expect(mockAttachmentsService.updateAttachment).toHaveBeenCalledWith(
                updatedAttachmentDto,
                mockPost.id,
                'post',
                mockTransactionalEntityManager,
            );
            expect(result.attachments[0].description).toEqual(updatedAttachmentDto.description);
        });

        it('should delete attachments during update', async () => {
            const existingAttachment = {
                id: 'att-id-1',
                url: 'url1',
                publicId: 'pid1',
                description: 'Old Desc',
            } as PostAttachment;
            const postWithAttachments = { ...mockPost, attachments: [existingAttachment] };
            const updateAttachmentDto = { id: 'att-id-1', delete: true };
            const updatePostDto: UpdatePostDto = {
                updatedAttachments: [updateAttachmentDto],
            };

            mockTransactionalEntityManager.findOne.mockResolvedValue(postWithAttachments);
            mockAttachmentsService.updateAttachment.mockResolvedValueOnce(null);
            mockAttachmentsService.findAttachmentsByParentId.mockResolvedValue([]);
            mockTransactionalEntityManager.save.mockResolvedValue(postWithAttachments);

            const result = await service.update(mockPost.id, updatePostDto, mockUser.id);

            expect(mockDataSource.transaction).toHaveBeenCalled();
            expect(mockAttachmentsService.updateAttachment).toHaveBeenCalledWith(
                updateAttachmentDto,
                mockPost.id,
                'post',
                mockTransactionalEntityManager,
            );
            expect(result.attachments).toEqual([]);
        });

        it('should delete attachments by id during update', async () => {
            const existingAttachment = {
                id: 'att-id-1',
                url: 'url1',
                publicId: 'pid1',
                description: 'Old Desc',
            } as PostAttachment;
            const postWithAttachments = { ...mockPost, attachments: [existingAttachment] };
            const updatePostDto: UpdatePostDto = {
                deletedAttachmentIds: ['att-id-1'],
            };

            mockTransactionalEntityManager.findOne.mockResolvedValue(postWithAttachments);
            mockAttachmentsService.deleteAttachment.mockResolvedValue(undefined);
            mockAttachmentsService.findAttachmentsByParentId.mockResolvedValue([]);
            mockTransactionalEntityManager.save.mockResolvedValue(postWithAttachments);

            const result = await service.update(mockPost.id, updatePostDto, mockUser.id);

            expect(mockDataSource.transaction).toHaveBeenCalled();
            expect(mockAttachmentsService.deleteAttachment).toHaveBeenCalledWith(
                'att-id-1',
                mockPost.id,
                'post',
                mockTransactionalEntityManager,
            );
            expect(result.attachments).toEqual([]);
        });

        it('should throw InternalServerErrorException if post not found', async () => {
            mockTransactionalEntityManager.findOne.mockResolvedValue(null);

            await expect(service.update('non-existent-id', {}, mockUser.id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw InternalServerErrorException if user is not the author', async () => {
            const anotherUser = { id: 'another-user-uuid' } as User;
            mockTransactionalEntityManager.findOne.mockResolvedValue(mockPost);

            await expect(service.update(mockPost.id, {}, anotherUser.id)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw InternalServerErrorException on createAttachment error', async () => {
            const newAttachmentDto = { fileContent: 'base64newimage', description: 'New Image' };
            const updatePostDto: UpdatePostDto = {
                newAttachments: [newAttachmentDto],
            };

            mockTransactionalEntityManager.findOne.mockResolvedValue(mockPost);
            mockAttachmentsService.createAttachment.mockRejectedValue(
                new Error('Attachment creation failed'),
            );
            mockTransactionalEntityManager.save.mockResolvedValue(mockPost);

            await expect(service.update(mockPost.id, updatePostDto, mockUser.id)).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException on updateAttachment error', async () => {
            const existingAttachment = {
                id: 'att-id-1',
                url: 'url1',
                publicId: 'pid1',
                description: 'Old Desc',
            } as PostAttachment;
            const postWithAttachments = { ...mockPost, attachments: [existingAttachment] };
            const updatedAttachmentDto = { id: 'att-id-1', description: 'Updated Desc' };
            const updatePostDto: UpdatePostDto = {
                updatedAttachments: [updatedAttachmentDto],
            };

            mockTransactionalEntityManager.findOne.mockResolvedValue(postWithAttachments);
            mockAttachmentsService.updateAttachment.mockRejectedValue(
                new Error('Attachment update failed'),
            );
            mockTransactionalEntityManager.save.mockResolvedValue(postWithAttachments);

            await expect(service.update(mockPost.id, updatePostDto, mockUser.id)).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException on deleteAttachment error', async () => {
            const existingAttachment = {
                id: 'att-id-1',
                url: 'url1',
                publicId: 'pid1',
                description: 'Old Desc',
            } as PostAttachment;
            const postWithAttachments = { ...mockPost, attachments: [existingAttachment] };
            const updatePostDto: UpdatePostDto = {
                deletedAttachmentIds: ['att-id-1'],
            };

            mockTransactionalEntityManager.findOne.mockResolvedValue(postWithAttachments);
            mockAttachmentsService.deleteAttachment.mockRejectedValue(
                new Error('Attachment delete failed'),
            );
            mockTransactionalEntityManager.save.mockResolvedValue(postWithAttachments);

            await expect(service.update(mockPost.id, updatePostDto, mockUser.id)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('remove', () => {
        const mockUser = { id: 'author-uuid' } as User;
        const mockPost = {
            id: 'post-uuid',
            postTitle: 'Test Post',
            content: 'Test Content',
            author: mockUser,
            authorId: mockUser.id,
            attachments: [],
            viewsCount: 0,
            likesCount: 0,
            dislikesCount: 0,
            commentsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            reactions: [],
            comments: [],
        } as unknown as Post;

        it('should remove a post successfully without attachments', async () => {
            mockTransactionalEntityManager.findOne.mockResolvedValue(mockPost);
            mockTransactionalEntityManager.remove.mockResolvedValue(undefined);

            await service.remove(mockPost.id, mockUser.id);

            expect(mockTransactionalEntityManager.findOne).toHaveBeenCalledWith(Post, {
                where: { id: mockPost.id },
                relations: ['author', 'attachments'],
            });
            expect(mockTransactionalEntityManager.remove).toHaveBeenCalledWith(mockPost);
        });

        it('should remove a post successfully with attachments', async () => {
            const attachment1 = { id: 'att-id-1', publicId: 'pid1', url: 'url1' } as PostAttachment;
            const attachment2 = { id: 'att-id-2', publicId: 'pid2', url: 'url2' } as PostAttachment;
            const postWithAttachments = { ...mockPost, attachments: [attachment1, attachment2] };

            mockTransactionalEntityManager.findOne.mockResolvedValue(postWithAttachments);
            mockAttachmentsService.deleteAttachment.mockResolvedValue(undefined);
            mockTransactionalEntityManager.remove.mockResolvedValue(undefined);

            await service.remove(postWithAttachments.id, mockUser.id);

            expect(mockAttachmentsService.deleteAttachment).toHaveBeenCalledWith(
                attachment1.id,
                postWithAttachments.id,
                'post',
                mockTransactionalEntityManager,
            );
            expect(mockAttachmentsService.deleteAttachment).toHaveBeenCalledWith(
                attachment2.id,
                postWithAttachments.id,
                'post',
                mockTransactionalEntityManager,
            );
            expect(mockTransactionalEntityManager.remove).toHaveBeenCalledWith(postWithAttachments);
        });

        it('should throw NotFoundException if post not found', async () => {
            mockTransactionalEntityManager.findOne.mockResolvedValue(null);

            await expect(service.remove('non-existent-id', mockUser.id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException if user is not the author', async () => {
            const anotherUser = { id: 'another-user-uuid' } as User;
            mockTransactionalEntityManager.findOne.mockResolvedValue(mockPost);

            await expect(service.remove(mockPost.id, anotherUser.id)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw InternalServerErrorException on deleteAttachment error', async () => {
            const attachment1 = { id: 'att-id-1', publicId: 'pid1', url: 'url1' } as PostAttachment;
            const postWithAttachments = { ...mockPost, attachments: [attachment1] };

            mockTransactionalEntityManager.findOne.mockResolvedValue(postWithAttachments);
            mockAttachmentsService.deleteAttachment.mockRejectedValue(
                new Error('Attachment delete failed'),
            );

            await expect(service.remove(postWithAttachments.id, mockUser.id)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('find', () => {
        const mockPosts = [
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
                reactions: [],
                comments: [],
            },
            {
                id: 'post-uuid-2',
                postTitle: 'Test Post 2',
                content: 'Content 2',
                authorId: 'author-uuid-2',
                author: { id: 'author-uuid-2', username: 'user2' } as User,
                viewsCount: 0,
                likesCount: 0,
                dislikesCount: 0,
                commentsCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                attachments: [],
                reactions: [],
                comments: [],
            },
        ] as unknown as Post[];

        it('should return paginated posts', async () => {
            const queryDto: FindPostsQueryDto = { page: 1, limit: 10 };
            mockQueryBuilder.getManyAndCount.mockResolvedValue([mockPosts, mockPosts.length]);

            const result = await service.find(queryDto);

            expect(result.data).toEqual(mockPosts);
            expect(result.total).toEqual(mockPosts.length);
            expect(result.page).toEqual(1);
            expect(result.limit).toEqual(10);
            expect(result.totalPages).toEqual(Math.ceil(mockPosts.length / 10));
        });

        it('should filter posts by search term', async () => {
            const queryDto: FindPostsQueryDto = { search: 'Test Post 1' };
            mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPosts[0]], 1]);

            const result = await service.find(queryDto);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining("to_tsvector('english', post.postTitle)"),
                expect.objectContaining({ tsQueryTerm: 'Test:* & Post:* & 1:*' }),
            );
            expect(result.data).toEqual([mockPosts[0]]);
        });

        it('should filter posts by id', async () => {
            const queryDto: FindPostsQueryDto = { id: 'post-uuid-1' };
            mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPosts[0]], 1]);

            const result = await service.find(queryDto);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.id = :id', {
                id: 'post-uuid-1',
            });
            expect(result.data).toEqual([mockPosts[0]]);
        });

        it('should filter posts by authorId', async () => {
            const queryDto: FindPostsQueryDto = { authorId: 'author-uuid-1' };
            mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPosts[0]], 1]);

            const result = await service.find(queryDto);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.authorId = :authorId', {
                authorId: 'author-uuid-1',
            });
            expect(result.data).toEqual([mockPosts[0]]);
        });

        it('should sort posts by sortBy and sortOrder', async () => {
            const queryDto: FindPostsQueryDto = { sortBy: 'viewsCount', sortOrder: 'ASC' };
            mockQueryBuilder.getManyAndCount.mockResolvedValue([mockPosts, mockPosts.length]);

            const result = await service.find(queryDto);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('post.viewsCount', 'ASC');
            expect(result.data).toEqual(mockPosts);
        });

        it('should select specific fields', async () => {
            const queryDto: FindPostsQueryDto = { fields: 'id,postTitle' };
            mockQueryBuilder.getManyAndCount.mockResolvedValue([mockPosts, mockPosts.length]);

            const result = await service.find(queryDto);

            expect(mockQueryBuilder.select).toHaveBeenCalledWith(['post.id', 'post.postTitle']);
            expect(result.data).toEqual(mockPosts);
        });

        it('should increment viewsCount when a single post is returned', async () => {
            const singlePost = [{ ...mockPosts[0], viewsCount: 0 }];
            const queryDto: FindPostsQueryDto = { id: singlePost[0].id };
            mockQueryBuilder.getManyAndCount.mockResolvedValue([singlePost, 1]);

            await service.find(queryDto);

            expect(mockPostRepository.increment).toHaveBeenCalledWith(
                { id: singlePost[0].id },
                'viewsCount',
                1,
            );
        });

        it('should not increment viewsCount when multiple posts are returned', async () => {
            const queryDto: FindPostsQueryDto = { limit: 2 };
            mockQueryBuilder.getManyAndCount.mockResolvedValue([mockPosts, mockPosts.length]);
            mockPostRepository.increment.mockClear();

            await service.find(queryDto);

            expect(mockPostRepository.increment).not.toHaveBeenCalled();
        });
    });

    describe('reaction', () => {
        const mockUser = { id: 'user-uuid' } as User;
        const mockPostId = 'post-uuid';
        const mockPost = {
            id: mockPostId,
            postTitle: 'Test Post',
            content: 'Test Content',
            authorId: 'author-uuid',
            viewsCount: 0,
            likesCount: 0,
            dislikesCount: 0,
            commentsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            attachments: [],
            reactions: [],
            comments: [],
            author: { id: 'author-uuid' } as User,
        } as unknown as Post;

        beforeEach(() => {
            mockTransactionalEntityManager.findOne.mockImplementation((entity, options) => {
                if (entity === Post && options.where.id === mockPostId) {
                    return Promise.resolve(mockPost);
                }
                return Promise.resolve(null);
            });
            mockPost.likesCount = 0;
            mockPost.dislikesCount = 0;
            mockTransactionalEntityManager.save.mockClear();
            mockTransactionalEntityManager.delete.mockClear();
            mockPostRepository.increment.mockClear();
            mockPostRepository.decrement.mockClear();
            mockReactionsService.addOrUpdateReaction.mockClear();
            mockReactionsService.removeAllReactionsForParent.mockClear();
        });

        it('should add a LIKE reaction to a post', async () => {
            const addReactionDto: BaseAddReactionDto = {
                parentId: mockPostId,
                type: ReactionType.LIKE,
            };

            await service.reaction(mockUser.id, addReactionDto);

            expect(mockReactionsService.addOrUpdateReaction).toHaveBeenCalledWith(
                addReactionDto,
                mockUser.id,
                'post',
                mockTransactionalEntityManager,
            );
        });

        it('should add a DISLIKE reaction to a post', async () => {
            const addReactionDto: BaseAddReactionDto = {
                parentId: mockPostId,
                type: ReactionType.DISLIKE,
            };

            await service.reaction(mockUser.id, addReactionDto);

            expect(mockReactionsService.addOrUpdateReaction).toHaveBeenCalledWith(
                addReactionDto,
                mockUser.id,
                'post',
                mockTransactionalEntityManager,
            );
        });

        it('should remove an existing LIKE reaction', async () => {
            const addReactionDto: BaseAddReactionDto = { parentId: mockPostId, type: null };

            await service.reaction(mockUser.id, addReactionDto);

            expect(mockReactionsService.addOrUpdateReaction).toHaveBeenCalledWith(
                addReactionDto,
                mockUser.id,
                'post',
                mockTransactionalEntityManager,
            );
        });

        it('should remove an existing DISLIKE reaction', async () => {
            const addReactionDto: BaseAddReactionDto = { parentId: mockPostId, type: null };

            await service.reaction(mockUser.id, addReactionDto);

            expect(mockReactionsService.addOrUpdateReaction).toHaveBeenCalledWith(
                addReactionDto,
                mockUser.id,
                'post',
                mockTransactionalEntityManager,
            );
        });

        it('should change reaction from LIKE to DISLIKE', async () => {
            const addReactionDto: BaseAddReactionDto = {
                parentId: mockPostId,
                type: ReactionType.DISLIKE,
            };

            await service.reaction(mockUser.id, addReactionDto);

            expect(mockReactionsService.addOrUpdateReaction).toHaveBeenCalledWith(
                addReactionDto,
                mockUser.id,
                'post',
                mockTransactionalEntityManager,
            );
        });

        it('should change reaction from DISLIKE to LIKE', async () => {
            const addReactionDto: BaseAddReactionDto = {
                parentId: mockPostId,
                type: ReactionType.LIKE,
            };

            await service.reaction(mockUser.id, addReactionDto);

            expect(mockReactionsService.addOrUpdateReaction).toHaveBeenCalledWith(
                addReactionDto,
                mockUser.id,
                'post',
                mockTransactionalEntityManager,
            );
        });

        it('should throw NotFoundException if post not found', async () => {
            const addReactionDto: BaseAddReactionDto = {
                parentId: 'non-existent-id',
                type: ReactionType.LIKE,
            };
            mockReactionsService.addOrUpdateReaction.mockRejectedValue(new NotFoundException());
            await expect(service.reaction(mockUser.id, addReactionDto)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw an error if transaction fails', async () => {
            const addReactionDto: BaseAddReactionDto = {
                parentId: mockPostId,
                type: ReactionType.LIKE,
            };

            mockReactionsService.addOrUpdateReaction.mockRejectedValue(
                new Error('Transaction failed'),
            );
            await expect(service.reaction(mockUser.id, addReactionDto)).rejects.toThrow(Error);
        });
    });
});
