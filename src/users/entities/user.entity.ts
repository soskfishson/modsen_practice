import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

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

    @Column()
    displayName: string;

    @Column()
    userDescription: string;

    @Column({ default: false })
    isActive: boolean;

    @Column()
    registrationDate: Date;

    @Column({ nullable: true })
    refreshToken: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // TBA
    // @OneToMany(() => Post, post => post.author)
    // posts: Post[];

    // @OneToMany(() => Comment, comment => comment.author)
    // comments: Comment[];
}
