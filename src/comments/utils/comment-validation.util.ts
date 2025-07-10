import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Comment } from '../entities/comment.entity';
import { EntityManager } from 'typeorm';

export async function validateCommentOwnership(
    id: string,
    currentUserId: string,
    transactionalEntityManager: EntityManager,
): Promise<Comment> {
    const comment = await transactionalEntityManager.findOne(Comment, {
        where: { id },
        relations: ['author', 'attachments'],
    });

    if (!comment) {
        throw new NotFoundException(`Comment with ID ${id} not found.`);
    }

    if (comment.author.id !== currentUserId) {
        throw new ForbiddenException('You are not allowed to modify this comment.');
    }

    return comment;
}
