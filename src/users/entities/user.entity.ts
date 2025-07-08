import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Post } from '../../posts/entities/post.entity';
import { Reaction } from '../../posts/entities/reaction.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true })
    username: string;

    @Column()
    @Exclude()
    password: string;

    @Column({ nullable: true })
    displayName: string;

    @Column({ type: 'text', nullable: true })
    userDescription: string;

    @Column({ default: false })
    isActive: boolean;

    @Column()
    registrationDate: Date;

    @Column({ nullable: true })
    @Exclude()
    refreshToken: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Post, (post) => post.author)
    posts: Post[];

    //TBA
    // @OneToMany(() => Comment, (comment) => comment.author)
    // comments: Comment[];

    @OneToMany(() => Reaction, (reaction) => reaction.user)
    reactions: Reaction[];
}
