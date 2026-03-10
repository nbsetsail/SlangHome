import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { smartUpdate, getQuery } from '@/lib/db-adapter';
import { uploadAvatar as uploadToR2, deleteFromR2, getAvatarUrl, IS_VERCEL } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar');
    const smallFile = formData.get('avatarSmall');
    const userId = formData.get('userId');

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: 'Avatar file and userId are required' },
        { status: 400 }
      );
    }

    if (!(file instanceof File) || !file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
        { status: 400 }
      );
    }

    let avatarUrl: string;

    if (IS_VERCEL) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const result = await uploadToR2(String(userId), buffer);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to upload to R2' },
          { status: 500 }
        );
      }
      avatarUrl = result.url!;
      
      if (smallFile instanceof File && smallFile.type.startsWith('image/')) {
        const smallBuffer = Buffer.from(await smallFile.arrayBuffer());
        await uploadToR2(`${userId}_small`, smallBuffer);
      }
    } else {
      const uploadDir = path.join(process.cwd(), 'public', 'avatar');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const fileExtension = 'png';
      const fileName = `${userId}.${fileExtension}`;
      const smallFileName = `${userId}_small.${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      const smallFilePath = path.join(uploadDir, smallFileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      if (smallFile instanceof File && smallFile.type.startsWith('image/')) {
        const smallBytes = await smallFile.arrayBuffer();
        const smallBuffer = Buffer.from(smallBytes);
        await writeFile(smallFilePath, smallBuffer);
      }

      avatarUrl = `/avatar/${fileName}?t=${Date.now()}`;
    }

    await smartUpdate('users', { avatar: avatarUrl }, 'id = $1', [userId]);

    return NextResponse.json({
      success: true,
      data: {
        avatarUrl,
        message: 'Avatar uploaded successfully'
      }
    });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const user = await getQuery('SELECT avatar FROM users WHERE id = $1', [userId]);
    if (!user || !user.avatar) {
      return NextResponse.json(
        { success: true, message: 'No avatar to delete' }
      );
    }

    if (IS_VERCEL) {
      await deleteFromR2(`avatars/${userId}.webp`);
      await deleteFromR2(`avatars/${userId}_small.webp`);
    } else {
      const avatarPath = path.join(process.cwd(), 'public', user.avatar.split('?')[0].replace(/^\//, ''));
      if (existsSync(avatarPath)) {
        await unlink(avatarPath);
      }

      const smallAvatarPath = avatarPath.replace('.png', '_small.png');
      if (existsSync(smallAvatarPath)) {
        await unlink(smallAvatarPath);
      }
    }

    await smartUpdate('users', { avatar: null }, 'id = $1', [userId]);

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}
