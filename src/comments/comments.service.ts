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
import {
    LIKES_COUNT,
    DISLIKES_COUNT,
    POST_ID,
    COMMENT_ID,
    AUTHOR,
    ATTACHMENTS,
    CONTENT,
    USERNAME,
    EMAIL,
    DISPLAY_NAME,
    CREATED_AT,
    UPDATED_AT,
    PARENT_COMMENT_ID,
    POST_TITLE,
} from '../common/constants/entity-constants';

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

        const queryBuilder = this.commentsRepository.createQueryBuilder('comment');

        queryBuilder.leftJoinAndSelect('comment.author', 'author');
        queryBuilder.leftJoinAndSelect('comment.attachments', 'attachments');
        queryBuilder.leftJoinAndSelect('comment.post', 'post');
        queryBuilder.leftJoinAndSelect('comment.parentComment', 'parentComment');

        const validScalarFields: (keyof Comment)[] = [
            'id',
            CONTENT,
            'authorId',
            LIKES_COUNT,
            DISLIKES_COUNT,
            CREATED_AT,
            UPDATED_AT,
            POST_ID,
            PARENT_COMMENT_ID,
        ];

        const authorFields = [
            `author.id`,
            `author.${USERNAME}`,
            `author.${EMAIL}`,
            `author.${DISPLAY_NAME}`,
            'author.userDescription',
            'author.isActive',
            'author.registrationDate',
            `author.${CREATED_AT}`,
            `author.${UPDATED_AT}`,
            'author.profilePictureUrl',
        ];

        const attachmentFields = [
            'attachments.id',
            'attachments.url',
            'attachments.publicId',
            'attachments.description',
            `attachments.${COMMENT_ID}`,
        ];

        const postFields = [`post.id`, `post.${POST_TITLE}`, `post.${CONTENT}`];
        const parentCommentFields = [`parentComment.id`, `parentComment.${CONTENT}`];

        let fieldsToSelect: string[] = [];

        if (fields) {
            const requestedFieldsArray = fields.split(',');

            requestedFieldsArray.forEach((field) => {
                if (validScalarFields.includes(field as keyof Comment)) {
                    fieldsToSelect.push(`comment.${field}`);
                }
            });

            if (requestedFieldsArray.includes(AUTHOR)) {
                fieldsToSelect = fieldsToSelect.concat(authorFields);
            }
            if (requestedFieldsArray.includes(ATTACHMENTS)) {
                fieldsToSelect = fieldsToSelect.concat(attachmentFields);
            }
            if (requestedFieldsArray.includes(POST_ID)) {
                fieldsToSelect = fieldsToSelect.concat(postFields);
            }
            if (requestedFieldsArray.includes(PARENT_COMMENT_ID)) {
                fieldsToSelect = fieldsToSelect.concat(parentCommentFields);
            }

            if (fieldsToSelect.filter((f) => f.startsWith('comment.')).length === 0) {
                fieldsToSelect = fieldsToSelect.concat(
                    validScalarFields.map((field) => `comment.${field}`),
                );
            }
        } else {
            fieldsToSelect = [
                ...validScalarFields.map((field) => `comment.${field}`),
                ...authorFields,
                ...attachmentFields,
                ...postFields,
                ...parentCommentFields,
            ];
        }

        if (fieldsToSelect.length > 0) {
            queryBuilder.select(fieldsToSelect);
        }

        if (id) {
            queryBuilder.andWhere('comment.id = :id', { id });
        }

        if (authorId) {
            queryBuilder.andWhere(`comment.${AUTHOR}.id = :authorId`, { authorId });
        }

        if (postId) {
            queryBuilder.andWhere(`comment.${POST_ID} = :postId`, { postId });
        }

        if (
            parentCommentId === null ||
            parentCommentId === undefined ||
            parentCommentId === 'null'
        ) {
            queryBuilder.andWhere(`comment.${PARENT_COMMENT_ID} IS NULL`);
        } else {
            queryBuilder.andWhere(`comment.${PARENT_COMMENT_ID} = :parentCommentId`, {
                parentCommentId,
            });
        }

        if (search) {
            const tsQueryTerm = search
                .split(' ')
                .map((word) => `${word}:*`)
                .join(' & ');
            queryBuilder.andWhere(
                `(` +
                    `setweight(to_tsvector('english', comment.${CONTENT}), 'A') || ` +
                    `setweight(to_tsvector('english', coalesce(${AUTHOR}.${USERNAME}, '')), 'B') ||` +
                    `setweight(to_tsvector('english', coalesce(${AUTHOR}.${EMAIL}, '')), 'B') ||` +
                    `setweight(to_tsvector('english', coalesce(${AUTHOR}.${DISPLAY_NAME}, '')), 'B')` +
                    `) @@ to_tsquery('english', :tsQueryTerm)`,
                { tsQueryTerm },
            );
        }

        Object.keys(filters).forEach((key) => {
            if (validScalarFields.includes(key as keyof Comment)) {
                const filterValue = filters[key];
                const paramName = `param_${key}`;
                queryBuilder.andWhere(`comment.${key} = :${paramName}`, {
                    [paramName]: filterValue,
                });
            }
        });

        if (sortBy && validScalarFields.includes(sortBy as keyof Comment)) {
            queryBuilder.orderBy(`comment.${sortBy}`, sortOrder);
        } else {
            queryBuilder.orderBy(`comment.${CREATED_AT}`, 'DESC');
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
