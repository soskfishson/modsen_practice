import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    InternalServerErrorException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AttachmentsService } from '../attachments/attachments.service';
import { ReactionsService } from '../reactions/reactions.service';
import { Comment } from './entities/comment.entity';
import { CommentAttachment } from '../attachments/entities/comment-attachment.entity';
import { BaseAddReactionDto } from '../reactions/dto/base-add-reaction.dto';
import { validateCommentOwnership } from './utils/comment-validation.util';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { FindCommentsQueryDto } from './dto/find-comment-query.dto';
import { PaginatedCommentResponseDto } from './dto/paginated-comment-response.dto';

interface CreateCommentInput extends CreateCommentDto {
    authorId: string;
}

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private commentsRepository: Repository<Comment>,
        private attachmentsService: AttachmentsService,
        private dataSource: DataSource,
        private reactionsService: ReactionsService,
    ) {}
    async create(createCommentInput: CreateCommentInput): Promise<Comment> {
        const { attachments: attachmentDtos, authorId, ...commentData } = createCommentInput;

        return this.dataSource.transaction(async (transactionalEntityManager) => {
            const newComment = this.commentsRepository.create({
                ...commentData,
                author: { id: authorId },
            });
            const savedComment = await transactionalEntityManager.save(newComment);

            if (attachmentDtos && attachmentDtos.length > 0) {
                const attachmentPromises = attachmentDtos.map(async (dto) => {
                    return this.attachmentsService.createAttachment<CommentAttachment>(
                        dto,
                        savedComment.id,
                        'comment',
                        transactionalEntityManager,
                    );
                });

                await Promise.all(attachmentPromises);
            }

            return savedComment;
        });
    }

    async update(
        id: string,
        updateCommentDto: UpdateCommentDto,
        currentUserId: string,
    ): Promise<Comment> {
        const { newAttachments, updatedAttachments, deletedAttachmentIds, ...commentData } =
            updateCommentDto;

        return this.dataSource.transaction(async (transactionalEntityManager) => {
            try {
                const foundComment = await validateCommentOwnership(
                    id,
                    currentUserId,
                    transactionalEntityManager,
                );

                Object.assign(foundComment, commentData);

                if (newAttachments && newAttachments.length > 0) {
                    const createdAttachments = await Promise.all(
                        newAttachments.map(async (dto) => {
                            return this.attachmentsService.createAttachment(
                                dto,
                                foundComment.id,
                                'comment',
                                transactionalEntityManager,
                            );
                        }),
                    ).catch((error) => {
                        throw error;
                    });
                    foundComment.attachments = [
                        ...foundComment.attachments,
                        ...(createdAttachments as CommentAttachment[]),
                    ];
                }

                if (updatedAttachments && updatedAttachments.length > 0) {
                    for (const dto of updatedAttachments) {
                        const updated = await this.attachmentsService.updateAttachment(
                            dto,
                            foundComment.id,
                            'comment',
                            transactionalEntityManager,
                        );
                        if (updated) {
                            const index = foundComment.attachments.findIndex(
                                (att) => att.id === updated.id,
                            );
                            if (index !== -1) {
                                foundComment.attachments[index] = updated as CommentAttachment;
                            }
                        } else if (dto.delete) {
                            foundComment.attachments = foundComment.attachments.filter(
                                (att) => att.id !== dto.id,
                            );
                        }
                    }
                }

                if (deletedAttachmentIds && deletedAttachmentIds.length > 0) {
                    for (const attachmentId of deletedAttachmentIds) {
                        await this.attachmentsService.deleteAttachment(
                            attachmentId,
                            foundComment.id,
                            'comment',
                            transactionalEntityManager,
                        );
                    }
                }

                foundComment.attachments = (await this.attachmentsService.findAttachmentsByParentId(
                    foundComment.id,
                    'comment',
                    transactionalEntityManager,
                )) as CommentAttachment[];

                const finalComment = await transactionalEntityManager.save(foundComment);

                return transactionalEntityManager.findOne(Comment, {
                    where: { id: finalComment.id },
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
        }) as unknown as Comment;
    }

    async remove(id: string, currentUserId: string): Promise<void> {
        return this.dataSource.transaction(async (transactionalEntityManager) => {
            try {
                const comment = await validateCommentOwnership(
                    id,
                    currentUserId,
                    transactionalEntityManager,
                );

                if (comment.attachments && comment.attachments.length > 0) {
                    await Promise.all(
                        comment.attachments.map(async (attachment) => {
                            await this.attachmentsService.deleteAttachment(
                                attachment.id,
                                comment.id,
                                'comment',
                                transactionalEntityManager,
                            );
                        }),
                    );
                }

                await this.reactionsService.removeAllReactionsForParent(
                    comment.id,
                    'comment',
                    transactionalEntityManager,
                );

                await transactionalEntityManager.remove(comment);
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

    async find(queryDto: FindCommentsQueryDto): Promise<PaginatedCommentResponseDto> {
        const {
            page = 1,
            limit = 10,
            search,
            sortBy,
            sortOrder,
            fields,
            id,
            authorId,
            postId,
            parentCommentId: rawParentCommentId,
            ...filters
        } = queryDto;

        let parentCommentId: string | null | undefined = rawParentCommentId;

        if (
            typeof parentCommentId === 'string' &&
            parentCommentId.toLowerCase().trim() === 'null'
        ) {
            parentCommentId = null;
        }

        const queryBuilder = this.commentsRepository
            .createQueryBuilder('comment')
            .leftJoinAndSelect('comment.author', 'author')
            .leftJoinAndSelect('comment.attachments', 'attachments')
            .leftJoinAndSelect('comment.post', 'post')
            .leftJoinAndSelect('comment.parentComment', 'parentComment');

        const validFields: (keyof Comment)[] = [
            'id',
            'content',
            'authorId',
            'likesCount',
            'dislikesCount',
            'createdAt',
            'updatedAt',
            'postId',
            'parentCommentId',
        ];

        if (fields) {
            const requestedFields = fields.split(',') as (keyof Comment)[];
            const selectedFields = requestedFields.filter((field) => validFields.includes(field));
            if (selectedFields.length > 0) {
                queryBuilder.select(selectedFields.map((field) => `comment.${field}`));
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
                if (requestedFields.includes('post')) {
                    queryBuilder.addSelect(['post.id', 'post.postTitle', 'post.content']);
                }
                if (requestedFields.includes('parentComment')) {
                    queryBuilder.addSelect(['parentComment.id', 'parentComment.content']);
                }
            } else {
                queryBuilder.select(validFields.map((field) => `comment.${field}`));
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
                queryBuilder.addSelect(['post.id', 'post.postTitle', 'post.content']);
                queryBuilder.addSelect(['parentComment.id', 'parentComment.content']);
            }
        } else {
            queryBuilder.select(validFields.map((field) => `comment.${field}`));
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
            queryBuilder.addSelect(['post.id', 'post.postTitle', 'post.content']);
            queryBuilder.addSelect(['parentComment.id', 'parentComment.content']);
        }

        if (id) {
            queryBuilder.andWhere('comment.id = :id', { id });
        }

        if (authorId) {
            queryBuilder.andWhere('comment.authorId = :authorId', { authorId });
        }

        if (postId) {
            queryBuilder.andWhere('comment.postId = :postId', { postId });
        }

        if (
            parentCommentId === null ||
            parentCommentId === undefined ||
            parentCommentId === 'null'
        ) {
            queryBuilder.andWhere('comment.parentCommentId IS NULL');
        } else {
            queryBuilder.andWhere('comment.parentCommentId = :parentCommentId', {
                parentCommentId,
            });
        }

        if (search) {
            const tsQueryTerm = search
                .split(' ')
                .map((word) => `${word}:*`)
                .join(' & ');
            queryBuilder.andWhere(
                `(
                    setweight(to_tsvector('english', comment.content), 'A') || 
                    setweight(to_tsvector('english', coalesce(author.username, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(author.email, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(author.displayName, '')), 'B')
                ) @@ to_tsquery('english', :tsQueryTerm)`,
                { tsQueryTerm },
            );
        }

        Object.keys(filters).forEach((key) => {
            if (validFields.includes(key as keyof Comment)) {
                const filterValue = filters[key];
                const paramName = `param_${key}`;
                queryBuilder.andWhere(`comment.${key} = :${paramName}`, {
                    [paramName]: filterValue,
                });
            }
        });

        if (sortBy && validFields.includes(sortBy as keyof Comment)) {
            queryBuilder.orderBy(`comment.${sortBy}`, sortOrder);
        } else {
            queryBuilder.orderBy('comment.createdAt', 'DESC');
        }

        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        const [comments, total] = await queryBuilder.getManyAndCount();

        return {
            data: comments,
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
                'comment',
                transactionalEntityManager,
            );
        });
    }
}
