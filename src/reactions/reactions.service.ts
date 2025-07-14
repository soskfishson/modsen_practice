import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { PostReaction } from './entities/post-reaction.entity';
import { CommentReaction } from './entities/comment-reaction.entity';
import { BaseAddReactionDto } from './dto/base-add-reaction.dto';
import { ReactionType } from './interfaces/reaction.interface';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';

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

        if (parentType === 'post') {
            reactionRepository = this.postReactionRepository as Repository<PostReaction>;
            existingReaction = await transactionalEntityManager.findOne(PostReaction, {
                where: { userId, postId: addReactionDto.parentId },
            });
            parentEntity = Post;
            parentEntityName = 'Post';
        } else {
            reactionRepository = this.commentReactionRepository as Repository<CommentReaction>;
            existingReaction = await transactionalEntityManager.findOne(CommentReaction, {
                where: { userId, commentId: addReactionDto.parentId },
            });
            parentEntity = Comment;
            parentEntityName = 'Comment';
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

            if (existingReaction.type === ReactionType.LIKE) {
                await transactionalEntityManager.decrement(
                    parentEntity,
                    { id: addReactionDto.parentId },
                    'likesCount',
                    1,
                );
            } else if (existingReaction.type === ReactionType.DISLIKE) {
                await transactionalEntityManager.decrement(
                    parentEntity,
                    { id: addReactionDto.parentId },
                    'dislikesCount',
                    1,
                );
            }
        }

        if (addReactionDto.type !== null) {
            let newReaction: PostReaction | CommentReaction;
            if (parentType === 'post') {
                newReaction = reactionRepository.create({
                    type: addReactionDto.type,
                    userId: userId,
                    postId: addReactionDto.parentId,
                });
            } else {
                newReaction = reactionRepository.create({
                    type: addReactionDto.type,
                    userId: userId,
                    commentId: addReactionDto.parentId,
                });
            }
            await transactionalEntityManager.save(newReaction);

            if (addReactionDto.type === ReactionType.LIKE) {
                await transactionalEntityManager.increment(
                    parentEntity,
                    { id: addReactionDto.parentId },
                    'likesCount',
                    1,
                );
            } else if (addReactionDto.type === ReactionType.DISLIKE) {
                await transactionalEntityManager.increment(
                    parentEntity,
                    { id: addReactionDto.parentId },
                    'dislikesCount',
                    1,
                );
            }
        }
    }

    async removeAllReactionsForParent(
        parentId: string,
        parentType: 'post' | 'comment',
        transactionalEntityManager: EntityManager,
    ): Promise<void> {
        if (parentType === 'post') {
            await transactionalEntityManager.delete(PostReaction, { postId: parentId });
        } else {
            await transactionalEntityManager.delete(CommentReaction, { commentId: parentId });
        }
    }
}
