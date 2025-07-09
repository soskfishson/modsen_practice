import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { CommentReaction } from './comment-reaction.entity';
import { CommentAttachment } from '../../attachments/entities/comment-attachment.entity';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'author_id' })
    authorId: string;

    @ManyToOne(() => User, (user) => user.comments, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @Column({ name: 'post_id', nullable: true })
    postId: string;

    @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'post_id' })
    post: Post;

    @Column({ name: 'parent_comment_id', nullable: true })
    parentCommentId: string;

    @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'parent_comment_id' })
    parentComment: Comment;

    @OneToMany(() => Comment, (comment) => comment.parentComment)
    replies: Comment[];

    @Column({ type: 'int', default: 0 })
    likesCount: number;

    @Column({ type: 'int', default: 0 })
    dislikesCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => CommentReaction, (commentReaction) => commentReaction.comment, {
        cascade: true,
    })
    reactions: CommentReaction[];

    @OneToMany(() => CommentAttachment, (attachment) => attachment.comment, {
        cascade: ['insert', 'update'],
    })
    attachments: CommentAttachment[];
}
