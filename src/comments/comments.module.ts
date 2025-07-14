import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Comment } from './entities/comment.entity';
import { CommentsService } from './comments.service';
import { ReactionsModule } from '../reactions/reactions.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { CommentsController } from './comments.controller';
@Module({
    imports: [
        TypeOrmModule.forFeature([Comment]),
        CloudinaryModule,
        ReactionsModule,
        AttachmentsModule,
    ],
    controllers: [CommentsController],
    providers: [CommentsService],
    exports: [CommentsService],
})
export class CommentsModule {}
