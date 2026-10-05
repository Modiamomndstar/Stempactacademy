import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  provider: 'r2' | 'local';
}

class StorageService {
  private client: S3Client | null = null;
  private bucketName: string = '';
  private publicUrl: string = '';
  private isConfigured: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (accountId && accessKeyId && secretAccessKey && bucketName) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.bucketName = bucketName;
      this.publicUrl = publicUrl ? publicUrl.replace(/\/$/, '') : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
      this.isConfigured = true;
      console.log(`☁️ [R2 Storage] Connected to Cloudflare R2 bucket: "${bucketName}"`);
    } else {
      this.isConfigured = false;
      console.log('ℹ️ [R2 Storage] R2 credentials not fully set; using local disk storage fallback.');
    }
  }

  /**
   * Upload buffer to Cloudflare R2 or local disk fallback
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'receipts'
  ): Promise<UploadResult> {
    // Sanitize filename
    const ext = path.extname(originalName) || '.jpg';
    const cleanBase = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 40);
    const key = `${folder}/${Date.now()}_${cleanBase}${ext}`;

    if (this.isConfigured && this.client) {
      try {
        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
          })
        );

        const url = `${this.publicUrl}/${key}`;
        return {
          url,
          key,
          size: buffer.length,
          mimeType,
          provider: 'r2',
        };
      } catch (err: any) {
        console.error('❌ [R2 Storage Upload Error]:', err);
        // Fall through to local fallback if R2 upload fails
      }
    }

    // Local disk fallback
    const uploadsDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, `${Date.now()}_${cleanBase}${ext}`);
    fs.writeFileSync(localFilePath, buffer);

    const relativeUrl = `/uploads/${folder}/${path.basename(localFilePath)}`;
    return {
      url: relativeUrl,
      key,
      size: buffer.length,
      mimeType,
      provider: 'local',
    };
  }

  /**
   * Delete file by key
   */
  async deleteFile(key: string): Promise<boolean> {
    if (this.isConfigured && this.client) {
      try {
        await this.client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          })
        );
        return true;
      } catch (err) {
        console.error('Failed to delete file from R2:', err);
        return false;
      }
    }
    return false;
  }

  getStatus() {
    return {
      isConfigured: this.isConfigured,
      bucket: this.bucketName || null,
      publicUrl: this.publicUrl || null,
    };
  }
}

export const r2Service = new StorageService();
