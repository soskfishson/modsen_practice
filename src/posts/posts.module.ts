import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { AttachmentsModule } from '../attachments/attachments.module';
import { ReactionsModule } from '../reactions/reactions.module';

@Module({
    imports: [TypeOrmModule.forFeature([Post]), AttachmentsModule, ReactionsModule],
    controllers: [PostsController],
    providers: [PostsService],
    exports: [PostsService],
})
export class PostsModule {}
