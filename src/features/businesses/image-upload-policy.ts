export type ImageUploadPreset = 'avatar' | 'content' | 'cover' | 'document';

export type ImageUploadPolicy = {
  maxDimension: number;
  maxInputBytes: number;
  maxOutputBytes: number;
  quality: number;
  recompressAboveBytes: number;
};

export type ImageMetadata = {
  fileName?: string | null;
  fileSize?: number | null;
  height?: number | null;
  mimeType?: string | null;
  uri: string;
  width?: number | null;
};

export const IMAGE_UPLOAD_POLICIES: Record<ImageUploadPreset, ImageUploadPolicy> = {
  avatar: {
    maxDimension: 1024,
    maxInputBytes: 15 * 1024 * 1024,
    maxOutputBytes: 5 * 1024 * 1024,
    quality: 0.8,
    recompressAboveBytes: 250 * 1024,
  },
  content: {
    maxDimension: 1920,
    maxInputBytes: 15 * 1024 * 1024,
    maxOutputBytes: 5 * 1024 * 1024,
    quality: 0.82,
    recompressAboveBytes: 1024 * 1024,
  },
  cover: {
    maxDimension: 2560,
    maxInputBytes: 15 * 1024 * 1024,
    maxOutputBytes: 5 * 1024 * 1024,
    quality: 0.85,
    recompressAboveBytes: 1536 * 1024,
  },
  document: {
    maxDimension: 2560,
    maxInputBytes: 15 * 1024 * 1024,
    maxOutputBytes: 5 * 1024 * 1024,
    quality: 0.9,
    recompressAboveBytes: 2 * 1024 * 1024,
  },
};

const ALLOWED_INPUT_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export class ImageUploadError extends Error {
  constructor(
    public readonly code:
      | 'FILE_NOT_FOUND'
      | 'FILE_TOO_LARGE'
      | 'INVALID_DIMENSIONS'
      | 'INVALID_TYPE'
      | 'PROCESSING_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export function validateImageMetadata(
  image: ImageMetadata,
  policy: ImageUploadPolicy,
  fileSize = image.fileSize,
) {
  if (!image.uri)
    throw new ImageUploadError('FILE_NOT_FOUND', 'Não foi possível acessar a imagem.');
  if (!image.mimeType || !ALLOWED_INPUT_MIME_TYPES.has(image.mimeType.toLowerCase())) {
    throw new ImageUploadError('INVALID_TYPE', 'Escolha uma imagem JPEG, PNG, WebP ou HEIC.');
  }
  if (!image.width || !image.height || image.width < 1 || image.height < 1) {
    throw new ImageUploadError(
      'INVALID_DIMENSIONS',
      'Não foi possível ler as dimensões da imagem.',
    );
  }
  if (fileSize && fileSize > policy.maxInputBytes) {
    throw new ImageUploadError(
      'FILE_TOO_LARGE',
      'A imagem original é grande demais para ser processada.',
    );
  }
}

export function getResizeDimensions({
  height,
  maxDimension,
  width,
}: {
  height: number;
  maxDimension: number;
  width: number;
}) {
  const largestDimension = Math.max(width, height);
  if (largestDimension <= maxDimension) return null;
  const ratio = maxDimension / largestDimension;
  return { height: Math.round(height * ratio), width: Math.round(width * ratio) };
}

export function getOutputFormat(mimeType: string) {
  if (mimeType.toLowerCase() === 'image/png') {
    return { extension: 'png', mimeType: 'image/png' as const, format: 'png' as const };
  }
  return { extension: 'webp', mimeType: 'image/webp' as const, format: 'webp' as const };
}

export function shouldOptimizeImage({
  fileSize,
  height,
  mimeType,
  policy,
  width,
}: {
  fileSize?: number | null;
  height: number;
  mimeType: string;
  policy: ImageUploadPolicy;
  width: number;
}) {
  return (
    mimeType.toLowerCase() === 'image/heic' ||
    mimeType.toLowerCase() === 'image/heif' ||
    Math.max(width, height) > policy.maxDimension ||
    Boolean(fileSize && fileSize > policy.recompressAboveBytes)
  );
}
