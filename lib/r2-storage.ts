import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, unlink, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const IS_VERCEL = process.env.VERCEL === '1';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'slanghome';
const R2_PUBLIC_URL = process.env.R2_CUSTOM_DOMAIN 
  ? `https://${process.env.R2_CUSTOM_DOMAIN}`
  : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

let r2Client: S3Client | null = null;

const LOCAL_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

console.log(`🔧 图片存储模式: ${IS_VERCEL ? 'Cloudflare R2' : '本地存储 (public/uploads)'}`);

function getR2Client(): S3Client | null {
  if (!IS_VERCEL) {
    return null;
  }
  
  if (!r2Client) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error('R2 配置缺失。请设置 CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
    }
    
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
    
    console.log('✅ Cloudflare R2 连接已建立');
  }
  
  return r2Client;
}

async function ensureLocalDir() {
  if (!existsSync(LOCAL_UPLOAD_DIR)) {
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  }
}

export interface UploadOptions {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  cacheControl?: string;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export async function uploadToR2(options: UploadOptions): Promise<UploadResult> {
  if (!IS_VERCEL) {
    return uploadToLocal(options);
  }
  
  const client = getR2Client();
  if (!client) {
    return {
      success: false,
      error: 'R2 客户端未初始化',
    };
  }
  
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType || 'application/octet-stream',
      CacheControl: options.cacheControl || 'public, max-age=31536000',
    });
    
    await client.send(command);
    
    const publicUrl = `${R2_PUBLIC_URL}/${options.key}`;
    
    return {
      success: true,
      key: options.key,
      url: publicUrl,
    };
  } catch (error) {
    console.error('R2 上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    };
  }
}

async function uploadToLocal(options: UploadOptions): Promise<UploadResult> {
  try {
    await ensureLocalDir();
    
    const filePath = join(LOCAL_UPLOAD_DIR, options.key);
    const dir = join(filePath, '..');
    
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    
    const buffer = typeof options.body === 'string' 
      ? Buffer.from(options.body) 
      : Buffer.from(options.body as unknown as ArrayBuffer);
    
    await writeFile(filePath, buffer);
    
    const publicUrl = `/uploads/${options.key}`;
    
    return {
      success: true,
      key: options.key,
      url: publicUrl,
    };
  } catch (error) {
    console.error('本地存储失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '存储失败',
    };
  }
}

export async function deleteFromR2(key: string): Promise<{ success: boolean; error?: string }> {
  if (!IS_VERCEL) {
    return deleteFromLocal(key);
  }
  
  const client = getR2Client();
  if (!client) {
    return { success: false, error: 'R2 客户端未初始化' };
  }
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    
    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error('R2 删除失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败',
    };
  }
}

async function deleteFromLocal(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = join(LOCAL_UPLOAD_DIR, key);
    
    try {
      await access(filePath);
      await unlink(filePath);
    } catch {
    }
    
    return { success: true };
  } catch (error) {
    console.error('本地删除失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败',
    };
  }
}

export async function checkR2ObjectExists(key: string): Promise<boolean> {
  if (!IS_VERCEL) {
    return checkLocalExists(key);
  }
  
  const client = getR2Client();
  if (!client) {
    return false;
  }
  
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

async function checkLocalExists(key: string): Promise<boolean> {
  try {
    const filePath = join(LOCAL_UPLOAD_DIR, key);
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getAvatarKey(userId: string): string {
  return `avatars/${userId}.webp`;
}

export function getAvatarUrl(userId: string): string {
  if (!IS_VERCEL) {
    return `/uploads/avatars/${userId}.webp`;
  }
  
  return `${R2_PUBLIC_URL}/avatars/${userId}.webp`;
}

export function getImageKey(folder: string, id: string, extension: string = 'webp'): string {
  return `${folder}/${id}.${extension}`;
}

export function getImageUrl(key: string): string {
  if (!IS_VERCEL) {
    return `/uploads/${key}`;
  }
  
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function uploadAvatar(userId: string, imageBuffer: Buffer): Promise<UploadResult> {
  const key = getAvatarKey(userId);
  
  return uploadToR2({
    key,
    body: imageBuffer,
    contentType: 'image/webp',
    cacheControl: 'public, max-age=86400',
  });
}

export async function deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
  const key = getAvatarKey(userId);
  return deleteFromR2(key);
}

export function getStorageInfo() {
  return {
    type: IS_VERCEL ? 'cloudflare-r2' : 'local-filesystem',
    uploadDir: IS_VERCEL ? undefined : LOCAL_UPLOAD_DIR,
    bucket: IS_VERCEL ? R2_BUCKET_NAME : undefined,
    publicUrl: IS_VERCEL ? R2_PUBLIC_URL : '/uploads',
  };
}

export { IS_VERCEL, R2_BUCKET_NAME, R2_PUBLIC_URL };
