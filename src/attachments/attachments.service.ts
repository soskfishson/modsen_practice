import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PostAttachment } from './entities/post-attachment.entity';
import { CommentAttachment } from './entities/comment-attachment.entity';
import { CreateAttachmentDto } from './dto/base-create-attachment.dto';
import { UpdateAttachmentDto } from './dto/base-update-attachment.dto';

@Injectable()
export class AttachmentsService {
    constructor(
        private cloudinaryService: CloudinaryService,
        @InjectRepository(PostAttachment)
        private postAttachmentRepository: Repository<PostAttachment>,
        @InjectRepository(CommentAttachment)
        private commentAttachmentRepository: Repository<CommentAttachment>,
    ) {}

    async createAttachment<T extends PostAttachment | CommentAttachment>(
        createAttachmentDto: CreateAttachmentDto,
        parentId: string,
        parentType: 'post' | 'comment',
        transactionalEntityManager: EntityManager,
    ): Promise<T> {
        const buffer = Buffer.from(createAttachmentDto.fileContent, 'base64');
        const uploadResult = await this.cloudinaryService.uploadImage(buffer);

        let newAttachment: T;
        if (parentType === 'post') {
            newAttachment = transactionalEntityManager.create(PostAttachment, {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                description: createAttachmentDto.description,
                postId: parentId,
            }) as T;
        } else {
            newAttachment = transactionalEntityManager.create(CommentAttachment, {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                description: createAttachmentDto.description,
                commentId: parentId,
            }) as T;
        }
        return transactionalEntityManager.save(newAttachment);
    }

    async updateAttachment(
        updateAttachmentDto: UpdateAttachmentDto,
        parentId: string,
        parentType: 'post' | 'comment',
        transactionalEntityManager: EntityManager,
    ): Promise<PostAttachment | CommentAttachment | null> {
        let attachment: PostAttachment | CommentAttachment | null;

        if (parentType === 'post') {
            attachment = await transactionalEntityManager.findOne(PostAttachment, {
                where: { id: updateAttachmentDto.id, postId: parentId },
            });
        } else {
            attachment = await transactionalEntityManager.findOne(CommentAttachment, {
                where: { id: updateAttachmentDto.id, commentId: parentId },
            });
        }

        if (!attachment) {
            return null;
        }

        if (updateAttachmentDto.delete) {
            try {
                await this.cloudinaryService.deleteImage(attachment.publicId);
                await transactionalEntityManager.delete(
                    parentType === 'post' ? PostAttachment : CommentAttachment,
                    attachment.id,
                );
            } catch (error: unknown) {
                throw new InternalServerErrorException(
                    `Failed to delete attachment from Cloudinary or database: ${attachment.publicId}. ${error instanceof Error ? error.message : 'Unknown error'}`,
                );
            }
            return null;
        } else {
            Object.assign(attachment, { description: updateAttachmentDto.description });
            return transactionalEntityManager.save(attachment);
        }
    }

    async deleteAttachment(
        attachmentId: string,
        parentId: string,
        parentType: 'post' | 'comment',
        transactionalEntityManager: EntityManager,
    ): Promise<void> {
        let attachment: PostAttachment | CommentAttachment | null;

        if (parentType === 'post') {
            attachment = await transactionalEntityManager.findOne(PostAttachment, {
                where: { id: attachmentId, postId: parentId },
            });
        } else {
            attachment = await transactionalEntityManager.findOne(CommentAttachment, {
                where: { id: attachmentId, commentId: parentId },
            });
        }

        if (attachment) {
            try {
                await this.cloudinaryService.deleteImage(attachment.publicId);
                await transactionalEntityManager.delete(
                    parentType === 'post' ? PostAttachment : CommentAttachment,
                    attachment.id,
                );
            } catch (error: unknown) {
                throw new InternalServerErrorException(
                    `Failed to delete attachment from Cloudinary or database: ${attachment.publicId}. ${error instanceof Error ? error.message : 'Unknown error'}`,
                );
            }
        }
    }

    async findAttachmentsByParentId(
        parentId: string,
        parentType: 'post' | 'comment',
        transactionalEntityManager: EntityManager,
    ): Promise<(PostAttachment | CommentAttachment)[]> {
        if (parentType === 'post') {
            return transactionalEntityManager.find(PostAttachment, {
                where: { postId: parentId },
            });
        } else {
            return transactionalEntityManager.find(CommentAttachment, {
                where: { commentId: parentId },
            });
        }
    }
}
