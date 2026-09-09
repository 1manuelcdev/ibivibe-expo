import { describe, expect, it } from 'vitest';

import {
  getOutputFormat,
  getResizeDimensions,
  IMAGE_UPLOAD_POLICIES,
  ImageUploadError,
  shouldOptimizeImage,
  validateImageMetadata,
} from '@/features/businesses/image-upload-policy';

describe('image upload policy', () => {
  it('keeps aspect ratio and never upscales', () => {
    expect(getResizeDimensions({ height: 1000, maxDimension: 1920, width: 1200 })).toBeNull();
    expect(getResizeDimensions({ height: 2000, maxDimension: 1920, width: 4000 })).toEqual({
      height: 960,
      width: 1920,
    });
  });

  it('preserves PNG output and uses WebP for photographic formats', () => {
    expect(getOutputFormat('image/png')).toMatchObject({ extension: 'png', mimeType: 'image/png' });
    expect(getOutputFormat('image/jpeg')).toMatchObject({
      extension: 'webp',
      mimeType: 'image/webp',
    });
  });

  it('only optimizes images that need resize, conversion or meaningful compression', () => {
    const policy = IMAGE_UPLOAD_POLICIES.content;
    expect(
      shouldOptimizeImage({
        fileSize: 120_000,
        height: 1200,
        mimeType: 'image/jpeg',
        policy,
        width: 1600,
      }),
    ).toBe(false);
    expect(
      shouldOptimizeImage({
        fileSize: 120_000,
        height: 1200,
        mimeType: 'image/heic',
        policy,
        width: 1600,
      }),
    ).toBe(true);
    expect(
      shouldOptimizeImage({
        fileSize: 120_000,
        height: 1200,
        mimeType: 'image/jpeg',
        policy,
        width: 3000,
      }),
    ).toBe(true);
  });

  it('rejects invalid type, dimensions and oversized inputs before processing', () => {
    const image = { height: 800, mimeType: 'image/jpeg', uri: 'file:///image.jpg', width: 1200 };
    expect(() =>
      validateImageMetadata(
        { ...image, mimeType: 'application/pdf' },
        IMAGE_UPLOAD_POLICIES.content,
      ),
    ).toThrow(ImageUploadError);
    expect(() =>
      validateImageMetadata({ ...image, height: 0 }, IMAGE_UPLOAD_POLICIES.content),
    ).toThrow(ImageUploadError);
    expect(() =>
      validateImageMetadata(image, IMAGE_UPLOAD_POLICIES.content, 16 * 1024 * 1024),
    ).toThrow(ImageUploadError);
  });
});
