import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { ReactionType } from '../interfaces/reaction.interface';

@Entity('post_reactions')
@Unique(['userId', 'postId'])
export class PostReaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ReactionType,
    })
    type: ReactionType;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, (user) => user.postReactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'post_id' })
    postId: string;

    @ManyToOne(() => Post, (post) => post.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: Post;
}
