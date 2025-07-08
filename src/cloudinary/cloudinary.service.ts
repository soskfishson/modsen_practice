import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadImage(buffer: Buffer): Promise<any> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream({ resource_type: 'auto' }, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                })
                .end(buffer);
        });
    }

    async deleteImage(publicId: string): Promise<any> {
        return await cloudinary.uploader.destroy(publicId);
    }
}
