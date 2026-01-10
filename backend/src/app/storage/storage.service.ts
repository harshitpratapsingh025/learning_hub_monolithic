import { Injectable, BadRequestException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucket: string;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE_PATH,
    });
    this.bucket = process.env.GCS_BUCKET_NAME;
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    // Validate file size (e.g., 5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const blob = this.storage.bucket(this.bucket).file(filename);

    // Create write stream
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        reject(new BadRequestException(`Upload failed: ${err.message}`));
      });

      blobStream.on('finish', async () => {
        // Make file public (optional - adjust based on your needs)
        await blob.makePublic();
        
        const publicUrl = `https://storage.googleapis.com/${this.bucket}/${filename}`;
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  }

  async deleteImage(filename: string): Promise<void> {
    await this.storage.bucket(this.bucket).file(filename).delete();
  }
}