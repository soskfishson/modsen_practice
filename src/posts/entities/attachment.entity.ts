import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('attachments')
export class Attachment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    url: string;

    @Column()
    publicId: string;

    @Column({ nullable: true })
    description: string;

    @Column({ name: 'post_id' })
    postId: string;

    @ManyToOne(() => Post, (post) => post.attachments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: Post;
}
