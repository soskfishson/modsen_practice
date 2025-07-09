import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsService } from './reactions.service';
import { PostReaction } from './entities/post-reaction.entity';
import { CommentReaction } from './entities/comment-reaction.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PostReaction, CommentReaction])
    ],
    providers: [ReactionsService],
    exports: [ReactionsService],
})
export class ReactionsModule {} 