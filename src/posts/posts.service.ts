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
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Attachment } from './entities/attachment.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/entities/user.entity';
import { FindPostsQueryDto } from './dto/find-post-query.dto';
import { PaginatedPostResponseDto } from './dto/paginated-post-response.dto';

interface CreatePostInput extends CreatePostDto {
    authorId: string;
}

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private postsRepository: Repository<Post>,
        @InjectRepository(Attachment)
        private attachmentRepository: Repository<Attachment>,
        private cloudinaryService: CloudinaryService,
        private dataSource: DataSource,
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
                    const buffer = Buffer.from(dto.fileContent, 'base64');
                    const uploadResult = await this.cloudinaryService.uploadImage(buffer);

                    const newAttachment = this.attachmentRepository.create({
                        url: uploadResult.secure_url,
                        publicId: uploadResult.public_id,
                        description: dto.description,
                        post: savedPost,
                    });
                    return transactionalEntityManager.save(newAttachment);
                });

                await Promise.all(attachmentPromises);
            }

            return savedPost;
        });
    }

    async update(id: string, updatePostDto: UpdatePostDto, currentUser: User): Promise<Post> {
        const { newAttachments, updatedAttachments, deletedAttachmentIds, ...postData } =
            updatePostDto;

        return this.dataSource.transaction(async (transactionalEntityManager) => {
            try {
                const post = await transactionalEntityManager.findOne(Post, {
                    where: { id },
                    relations: ['author', 'attachments'],
                });

                if (!post) {
                    throw new NotFoundException(`Post with ID ${id} not found.`);
                }

                if (post.author.id !== currentUser.id) {
                    throw new ForbiddenException('You are not allowed to update this post.');
                }

                const foundPost: Post = post;

                Object.assign(foundPost, postData);

                if (newAttachments && newAttachments.length > 0) {
                    const createdAttachments = await Promise.all(
                        newAttachments.map(async (dto) => {
                            const buffer = Buffer.from(dto.fileContent, 'base64');
                            const uploadResult = await this.cloudinaryService.uploadImage(buffer);

                            const newAttachment = transactionalEntityManager.create(Attachment, {
                                url: uploadResult.secure_url,
                                publicId: uploadResult.public_id,
                                description: dto.description,
                                post: foundPost,
                            });
                            return transactionalEntityManager.save(newAttachment);
                        }),
                    ).catch((error) => {
                        throw error;
                    });
                    foundPost.attachments = [...foundPost.attachments, ...createdAttachments];
                }

                if (updatedAttachments && updatedAttachments.length > 0) {
                    for (const dto of updatedAttachments) {
                        const attachment = await transactionalEntityManager.findOne(Attachment, {
                            where: { id: dto.id, post: { id: foundPost.id } },
                        });

                        if (attachment) {
                            if (dto.delete) {
                                try {
                                    await this.cloudinaryService.deleteImage(attachment.publicId);
                                    await transactionalEntityManager.delete(
                                        Attachment,
                                        attachment.id,
                                    );
                                } catch (error) {
                                    throw error;
                                }
                            } else {
                                Object.assign(attachment, { description: dto.description });
                                await transactionalEntityManager.save(attachment);
                                const index = foundPost.attachments.findIndex(
                                    (att) => att.id === attachment.id,
                                );
                                if (index !== -1) {
                                    foundPost.attachments[index] = attachment;
                                }
                            }
                        }
                    }
                }

                if (deletedAttachmentIds && deletedAttachmentIds.length > 0) {
                    for (const attachmentId of deletedAttachmentIds) {
                        const attachment = await transactionalEntityManager.findOne(Attachment, {
                            where: { id: attachmentId, post: { id: foundPost.id } },
                        });
                        if (attachment) {
                            try {
                                await this.cloudinaryService.deleteImage(attachment.publicId);
                                await transactionalEntityManager.delete(Attachment, attachment.id);
                            } catch (error) {
                                throw error;
                            }
                        }
                    }
                }

                foundPost.attachments = await transactionalEntityManager.find(Attachment, {
                    where: { post: { id: foundPost.id } },
                });

                const finalPost = await transactionalEntityManager.save(foundPost);

                return transactionalEntityManager.findOne(Post, {
                    where: { id: finalPost.id },
                    relations: ['attachments', 'author'],
                });
            } catch (transactionError) {
                throw new InternalServerErrorException(transactionError);
            }
        }) as unknown as Post;
    }

    async remove(id: string, currentUser: User): Promise<void> {
        return this.dataSource.transaction(async (transactionalEntityManager) => {
            const post = await transactionalEntityManager.findOne(Post, {
                where: { id },
                relations: ['author', 'attachments'],
            });

            if (!post) {
                throw new NotFoundException(`Post with ID ${id} not found.`);
            }

            if (post.author.id !== currentUser.id) {
                throw new ForbiddenException('You are not allowed to delete this post.');
            }

            if (post.attachments && post.attachments.length > 0) {
                await Promise.all(
                    post.attachments.map(async (attachment) => {
                        try {
                            await this.cloudinaryService.deleteImage(attachment.publicId);
                        } catch (error) {
                            throw new InternalServerErrorException(
                                `Failed to delete attachment from Cloudinary: ${attachment.publicId}. ${error.message}`,
                            );
                        }
                    }),
                );
            }

            await transactionalEntityManager.remove(post);
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
}
