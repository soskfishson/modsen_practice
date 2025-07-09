import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('comment_attachments')
export class CommentAttachment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    url: string;

    @Column()
    publicId: string;

    @Column({ nullable: true })
    description: string;

    @Column({ name: 'comment_id' })
    commentId: string;

    @ManyToOne(() => Comment, (comment) => comment.attachments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'comment_id' })
    comment: Comment;
}
