import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';

export enum ReactionType {
    LIKE = 'LIKE',
    DISLIKE = 'DISLIKE',
}

@Entity('comment_reactions')
@Unique(['userId', 'commentId'])
export class CommentReaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: ReactionType,
    })
    type: ReactionType;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, (user) => user.commentReactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'comment_id' })
    commentId: string;

    @ManyToOne(() => Comment, (comment) => comment.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'comment_id' })
    comment: Comment;
}
