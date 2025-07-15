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
import { CommentReaction } from '../../reactions/entities/comment-reaction.entity';
import { CommentAttachment } from '../../attachments/entities/comment-attachment.entity';
import {
    COMMENTS_TABLE,
    AUTHOR,
    POST_ID,
    PARENT_COMMENT_ID,
    LIKES_COUNT,
    DISLIKES_COUNT,
    CREATED_AT,
    UPDATED_AT,
} from '../../common/constants/entity-constants';

@Entity(COMMENTS_TABLE)
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ name: `${AUTHOR}_id` })
    authorId!: string;

    @ManyToOne(() => User, (user) => user.comments, { onDelete: 'SET NULL' })
    @JoinColumn({ name: `${AUTHOR}_id` })
    author!: User;

    @Column({ name: `${POST_ID}`, nullable: true })
    postId!: string;

    @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: `${POST_ID}` })
    post!: Post;

    @Column({ name: `${PARENT_COMMENT_ID}`, nullable: true })
    parentCommentId!: string;

    @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: `${PARENT_COMMENT_ID}` })
    parentComment!: Comment;

    @OneToMany(() => Comment, (comment) => comment.parentComment)
    replies!: Comment[];

    @Column({ type: 'int', default: 0, name: LIKES_COUNT })
    likesCount!: number;

    @Column({ type: 'int', default: 0, name: DISLIKES_COUNT })
    dislikesCount!: number;

    @CreateDateColumn({ name: CREATED_AT })
    createdAt!: Date;

    @UpdateDateColumn({ name: UPDATED_AT })
    updatedAt!: Date;

    @OneToMany(() => CommentReaction, (commentReaction) => commentReaction.comment, {
        cascade: true,
    })
    reactions!: CommentReaction[];

    @OneToMany(() => CommentAttachment, (attachment) => attachment.comment, {
        cascade: ['insert', 'update'],
    })
    attachments!: CommentAttachment[];
}
