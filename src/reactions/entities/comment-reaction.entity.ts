import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { ReactionType } from '../interfaces/reaction.interface';

@Entity('comment_reactions')
export class CommentReaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: ReactionType })
    type!: ReactionType;

    @Column({ name: 'user_id' })
    userId!: string;

    @ManyToOne(() => User, (user) => user.commentReactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ name: 'comment_id' })
    commentId!: string;

    @ManyToOne(() => Comment, (comment) => comment.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'comment_id' })
    comment!: Comment;
}
