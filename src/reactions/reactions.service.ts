import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { PostReaction } from './entities/post-reaction.entity';
import { CommentReaction } from './entities/comment-reaction.entity';
import { BaseAddReactionDto } from './dto/base-add-reaction.dto';
import { ReactionType } from './interfaces/reaction.interface';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import {
    LIKES_COUNT,
    DISLIKES_COUNT,
    POST_ID,
    COMMENT_ID,
    COMMENTS_TABLE,
    POSTS_TABLE,
} from '../common/constants/entity-constants';

@Injectable()
export class ReactionsService {
    constructor(
        @InjectRepository(PostReaction)
        private postReactionRepository: Repository<PostReaction>,
        @InjectRepository(CommentReaction)
        private commentReactionRepository: Repository<CommentReaction>,
    ) {}

    async addOrUpdateReaction(
        addReactionDto: BaseAddReactionDto,
        userId: string,
        parentType: 'post' | 'comment',
        transactionalEntityManager: EntityManager,
    ): Promise<void> {
        let existingReaction: PostReaction | CommentReaction | null;
        let parentEntity: typeof Post | typeof Comment;
        let reactionRepository: Repository<PostReaction | CommentReaction>;
        let parentEntityName: string;

        switch (parentType) {
            case 'post':
                reactionRepository = this.postReactionRepository as Repository<PostReaction>;
                existingReaction = await transactionalEntityManager.findOne(PostReaction, {
                    where: { userId, postId: addReactionDto.parentId },
                });
                parentEntity = Post;
                parentEntityName = POSTS_TABLE;
                break;
            case 'comment':
                reactionRepository = this.commentReactionRepository as Repository<CommentReaction>;
                existingReaction = await transactionalEntityManager.findOne(CommentReaction, {
                    where: { userId, commentId: addReactionDto.parentId },
                });
                parentEntity = Comment;
                parentEntityName = COMMENTS_TABLE;
                break;
        }

        const parent = await transactionalEntityManager.findOne(parentEntity, {
            where: {
                id: addReactionDto.parentId,
            },
        });
        if (!parent) {
            throw new NotFoundException(
                `${parentEntityName} with ID ${addReactionDto.parentId} not found.`,
            );
        }

        if (existingReaction) {
            await transactionalEntityManager.delete(
                parentType === 'post' ? PostReaction : CommentReaction,
                existingReaction.id,
            );

            switch (existingReaction.type) {
                case ReactionType.LIKE:
                    await transactionalEntityManager.decrement(
                        parentEntity,
                        { id: addReactionDto.parentId },
                        LIKES_COUNT,
                        1,
                    );
                    break;
                case ReactionType.DISLIKE:
                    await transactionalEntityManager.decrement(
                        parentEntity,
                        { id: addReactionDto.parentId },
                        DISLIKES_COUNT,
                        1,
                    );
                    break;
            }
        }

        if (addReactionDto.type !== null) {
            let newReaction: PostReaction | CommentReaction;
            switch (parentType) {
                case 'post':
                    newReaction = reactionRepository.create({
                        type: addReactionDto.type,
                        userId: userId,
                        postId: addReactionDto.parentId,
                    });
                    break;
                case 'comment':
                    newReaction = reactionRepository.create({
                        type: addReactionDto.type,
                        userId: userId,
                        commentId: addReactionDto.parentId,
                    });
                    break;
            }
            await transactionalEntityManager.save(newReaction);

            switch (addReactionDto.type) {
                case ReactionType.LIKE:
                    await transactionalEntityManager.increment(
                        parentEntity,
                        { id: addReactionDto.parentId },
                        LIKES_COUNT,
                        1,
                    );
                    break;
                case ReactionType.DISLIKE:
                    await transactionalEntityManager.increment(
                        parentEntity,
                        { id: addReactionDto.parentId },
                        DISLIKES_COUNT,
                        1,
                    );
                    break;
            }
        }
    }

    async removeAllReactionsForParent(
        parentId: string,
        parentType: 'post' | 'comment',
        transactionalEntityManager: EntityManager,
    ): Promise<void> {
        if (parentType === 'post') {
            await transactionalEntityManager.delete(PostReaction, { [POST_ID]: parentId });
        } else {
            await transactionalEntityManager.delete(CommentReaction, { [COMMENT_ID]: parentId });
        }
    }
}
