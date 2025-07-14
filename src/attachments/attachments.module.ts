import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PostAttachment } from './entities/post-attachment.entity';
import { CommentAttachment } from './entities/comment-attachment.entity';
import { AttachmentsService } from './attachments.service';

@Module({
    imports: [TypeOrmModule.forFeature([PostAttachment, CommentAttachment]), CloudinaryModule],
    providers: [AttachmentsService],
    exports: [AttachmentsService],
})
export class AttachmentsModule {}
