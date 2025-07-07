import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

export enum ReactionType {
    LIKE = 'LIKE',
    DISLIKE = 'DISLIKE',
}

@Entity('reactions')
@Unique(['userId', 'postId'])
export class Reaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: ReactionType,
    })
    type: ReactionType;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, (user) => user.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'post_id' })
    postId: string;

    @ManyToOne(() => Post, (post) => post.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: Post;
}
