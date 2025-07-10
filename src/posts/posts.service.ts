import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import { FindPostsQueryDto } from './dto/find-post-query.dto';
import { PaginatedPostResponseDto } from './dto/paginated-post-response.dto';
import { BaseAddReactionDto } from '../reactions/dto/base-add-reaction.dto';
import { AttachmentsService } from '../attachments/attachments.service';
import { PostAttachment } from '../attachments/entities/post-attachment.entity';
import { ReactionsService } from '../reactions/reactions.service';
import { validatePostOwnership } from './utils/post-validation.util';

interface CreatePostInput extends CreatePostDto {
    authorId: string;
}

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private postsRepository: Repository<Post>,
        private attachmentsService: AttachmentsService,
        private dataSource: DataSource,
        private reactionsService: ReactionsService,
    ) {}

    async create(createPostInput: CreatePostInput): Promise<Post> {
        const { attachments: attachmentDtos, authorId, ...postData } = createPostInput;

        return this.dataSource.transaction(async (transactionalEntityManager) => {
            const newPost = this.postsRepository.create({
                ...postData,
                author: { id: authorId },
            });
            const savedPost = await transactionalEntityManager.save(newPost);

            if (attachmentDtos && attachmentDtos.length > 0) {
                const attachmentPromises = attachmentDtos.map(async (dto) => {
                    return this.attachmentsService.createAttachment<PostAttachment>(
                        dto,
                        savedPost.id,
                        'post',
                        transactionalEntityManager,
                    );
                });

                await Promise.all(attachmentPromises);
            }

            return savedPost;
        });
    }

    async update(id: string, updatePostDto: UpdatePostDto, currentUserId: string): Promise<Post> {
        const { newAttachments, updatedAttachments, deletedAttachmentIds, ...postData } =
            updatePostDto;

        return this.dataSource.transaction(async (transactionalEntityManager) => {
            try {
                const foundPost = await validatePostOwnership(
                    id,
                    currentUserId,
                    transactionalEntityManager,
                );

                Object.assign(foundPost, postData);

                if (newAttachments && newAttachments.length > 0) {
                    const createdAttachments = await Promise.all(
                        newAttachments.map(async (dto) => {
                            return this.attachmentsService.createAttachment(
                                dto,
                                foundPost.id,
                                'post',
                                transactionalEntityManager,
                            );
                        }),
                    ).catch((error) => {
                        throw error;
                    });
                    foundPost.attachments = [
                        ...foundPost.attachments,
                        ...(createdAttachments as PostAttachment[]),
                    ];
                }

                if (updatedAttachments && updatedAttachments.length > 0) {
                    for (const dto of updatedAttachments) {
                        const updated = await this.attachmentsService.updateAttachment(
                            dto,
                            foundPost.id,
                            'post',
                            transactionalEntityManager,
                        );
                        if (updated) {
                            const index = foundPost.attachments.findIndex(
                                (att) => att.id === updated.id,
                            );
                            if (index !== -1) {
                                foundPost.attachments[index] = updated as PostAttachment;
                            }
                        } else if (dto.delete) {
                            foundPost.attachments = foundPost.attachments.filter(
                                (att) => att.id !== dto.id,
                            );
                        }
                    }
                }

                if (deletedAttachmentIds && deletedAttachmentIds.length > 0) {
                    for (const attachmentId of deletedAttachmentIds) {
                        await this.attachmentsService.deleteAttachment(
                            attachmentId,
                            foundPost.id,
                            'post',
                            transactionalEntityManager,
                        );
                    }
                }

                foundPost.attachments = (await this.attachmentsService.findAttachmentsByParentId(
                    foundPost.id,
                    'post',
                    transactionalEntityManager,
                )) as PostAttachment[];

                const finalPost = await transactionalEntityManager.save(foundPost);

                return transactionalEntityManager.findOne(Post, {
                    where: { id: finalPost.id },
                    relations: ['attachments', 'author'],
                });
            } catch (transactionError) {
                if (
                    transactionError instanceof NotFoundException ||
                    transactionError instanceof ForbiddenException
                ) {
                    throw transactionError;
                }
                throw new InternalServerErrorException(transactionError);
            }
        }) as unknown as Post;
    }

    async remove(id: string, currentUserId: string): Promise<void> {
        return this.dataSource.transaction(async (transactionalEntityManager) => {
            try {
                const post = await validatePostOwnership(
                    id,
                    currentUserId,
                    transactionalEntityManager,
                );

                if (post.attachments && post.attachments.length > 0) {
                    await Promise.all(
                        post.attachments.map(async (attachment) => {
                            await this.attachmentsService.deleteAttachment(
                                attachment.id,
                                post.id,
                                'post',
                                transactionalEntityManager,
                            );
                        }),
                    );
                }

                await this.reactionsService.removeAllReactionsForParent(
                    post.id,
                    'post',
                    transactionalEntityManager,
                );

                await transactionalEntityManager.remove(post);
            } catch (transactionError) {
                if (
                    transactionError instanceof NotFoundException ||
                    transactionError instanceof ForbiddenException
                ) {
                    throw transactionError;
                }
                throw new InternalServerErrorException(transactionError);
            }
        });
    }

    async find(queryDto: FindPostsQueryDto): Promise<PaginatedPostResponseDto> {
        const {
            page = 1,
            limit = 10,
            search,
            sortBy,
            sortOrder,
            fields,
            id,
            authorId,
            ...filters
        } = queryDto;

        const queryBuilder = this.postsRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.attachments', 'attachments');

        const validFields: (keyof Post)[] = [
            'id',
            'postTitle',
            'content',
            'authorId',
            'viewsCount',
            'likesCount',
            'dislikesCount',
            'commentsCount',
            'createdAt',
            'updatedAt',
        ];

        if (fields) {
            const requestedFields = fields.split(',') as (keyof Post)[];
            const selectedFields = requestedFields.filter((field) => validFields.includes(field));
            if (selectedFields.length > 0) {
                queryBuilder.select(selectedFields.map((field) => `post.${field}`));
                if (requestedFields.includes('author')) {
                    queryBuilder.addSelect([
                        'author.id',
                        'author.username',
                        'author.email',
                        'author.displayName',
                        'author.userDescription',
                        'author.isActive',
                        'author.registrationDate',
                        'author.createdAt',
                        'author.updatedAt',
                    ]);
                }
                if (requestedFields.includes('attachments')) {
                    queryBuilder.addSelect([
                        'attachments.id',
                        'attachments.url',
                        'attachments.publicId',
                        'attachments.description',
                    ]);
                }
            } else {
                queryBuilder.select(validFields.map((field) => `post.${field}`));
                queryBuilder.addSelect([
                    'author.id',
                    'author.username',
                    'author.email',
                    'author.displayName',
                    'author.userDescription',
                    'author.isActive',
                    'author.registrationDate',
                    'author.createdAt',
                    'author.updatedAt',
                ]);
                queryBuilder.addSelect([
                    'attachments.id',
                    'attachments.url',
                    'attachments.publicId',
                    'attachments.description',
                ]);
            }
        } else {
            queryBuilder.select(validFields.map((field) => `post.${field}`));
            queryBuilder.addSelect([
                'author.id',
                'author.username',
                'author.email',
                'author.displayName',
                'author.userDescription',
                'author.isActive',
                'author.registrationDate',
                'author.createdAt',
                'author.updatedAt',
            ]);
            queryBuilder.addSelect([
                'attachments.id',
                'attachments.url',
                'attachments.publicId',
                'attachments.description',
            ]);
        }

        if (id) {
            queryBuilder.andWhere('post.id = :id', { id });
        }

        if (authorId) {
            queryBuilder.andWhere('post.authorId = :authorId', { authorId });
        }

        if (search) {
            const tsQueryTerm = search
                .split(' ')
                .map((word) => `${word}:*`)
                .join(' & ');
            queryBuilder.andWhere(
                `(
                    setweight(to_tsvector('english', post.postTitle), 'A') || 
                    setweight(to_tsvector('english', post.content), 'B') || 
                    setweight(to_tsvector('english', coalesce(author.username, '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(author.email, '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(author.displayName, '')), 'C')
                ) @@ to_tsquery('english', :tsQueryTerm)`,
                { tsQueryTerm },
            );
        }

        Object.keys(filters).forEach((key) => {
            if (validFields.includes(key as keyof Post)) {
                const filterValue = filters[key];
                const paramName = `param_${key}`;
                queryBuilder.andWhere(`post.${key} = :${paramName}`, { [paramName]: filterValue });
            }
        });

        if (sortBy && validFields.includes(sortBy as keyof Post)) {
            queryBuilder.orderBy(`post.${sortBy}`, sortOrder);
        } else {
            queryBuilder.orderBy('post.createdAt', 'DESC');
        }

        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        const [posts, total] = await queryBuilder.getManyAndCount();

        if (posts.length === 1) {
            await this.postsRepository.increment({ id: posts[0].id }, 'viewsCount', 1);
        }

        return {
            data: posts,
            total,
            page: page!,
            limit: limit!,
            totalPages: Math.ceil(total / limit!),
        };
    }

    async reaction(userId: string, addReactionDto: BaseAddReactionDto) {
        return this.dataSource.transaction(async (transactionalEntityManager) => {
            await this.reactionsService.addOrUpdateReaction(
                addReactionDto,
                userId,
                'post',
                transactionalEntityManager,
            );
        });
    }
}
