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
import { PostReaction } from '../../reactions/entities/post-reaction.entity';
import { PostAttachment } from '../../attachments/entities/post-attachment.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('posts')
export class Post {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    postTitle: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'author_id' })
    authorId: string;

    @ManyToOne(() => User, (user) => user.posts, {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @Column({ type: 'int', default: 0 })
    viewsCount: number;

    @Column({ type: 'int', default: 0 })
    likesCount: number;

    @Column({ type: 'int', default: 0 })
    dislikesCount: number;

    @Column({ type: 'int', default: 0 })
    commentsCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Comment, (comment) => comment.post, { cascade: true })
    comments: Comment[];

    @OneToMany(() => PostReaction, (reaction) => reaction.post, { cascade: true })
    reactions: PostReaction[];

    @OneToMany(() => PostAttachment, (attachment) => attachment.post, {
        cascade: ['insert', 'update'],
    })
    attachments: PostAttachment[];
}
