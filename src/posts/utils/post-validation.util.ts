import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Post } from '../entities/post.entity';
import { EntityManager } from 'typeorm';

export async function validatePostOwnership(
    id: string,
    currentUserId: string,
    transactionalEntityManager: EntityManager,
): Promise<Post> {
    const post = await transactionalEntityManager.findOne(Post, {
        where: { id },
        relations: ['author', 'attachments'],
    });

    if (!post) {
        throw new NotFoundException(`Post with ID ${id} not found.`);
    }

    if (post.author.id !== currentUserId) {
        throw new ForbiddenException('You are not allowed to modify this post.');
    }

    return post;
}
