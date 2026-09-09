import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';

import {
  getOutputFormat,
  getResizeDimensions,
  IMAGE_UPLOAD_POLICIES,
  ImageUploadError,
  type ImageMetadata,
  type ImageUploadPreset,
  shouldOptimizeImage,
  validateImageMetadata,
} from '@/features/businesses/image-upload-policy';

export type PreparedImage = {
  fileName: string;
  height: number;
  mimeType: string;
  size?: number;
  temporary: boolean;
  uri: string;
  width: number;
};

export async function prepareImageForUpload(
  image: ImageMetadata,
  preset: ImageUploadPreset,
): Promise<PreparedImage> {
  const policy = IMAGE_UPLOAD_POLICIES[preset];
  const source = new File(image.uri);
  if (!source.exists) {
    throw new ImageUploadError('FILE_NOT_FOUND', 'Não foi possível acessar a imagem selecionada.');
  }

  const readableDimensions = await readImageDimensions(image.uri);
  const readableImage = { ...image, ...readableDimensions };
  const sourceSize = source.size || image.fileSize;
  validateImageMetadata(readableImage, policy, sourceSize);
  const output = getOutputFormat(readableImage.mimeType!);
  const resize = getResizeDimensions({
    height: readableImage.height!,
    maxDimension: policy.maxDimension,
    width: readableImage.width!,
  });
  const shouldOptimize = shouldOptimizeImage({
    fileSize: sourceSize,
    height: readableImage.height!,
    mimeType: readableImage.mimeType!,
    policy,
    width: readableImage.width!,
  });

  if (!shouldOptimize) {
    return {
      fileName: image.fileName ?? `imagem.${output.extension}`,
      height: readableImage.height!,
      mimeType: readableImage.mimeType!,
      size: sourceSize ?? undefined,
      temporary: false,
      uri: image.uri,
      width: readableImage.width!,
    };
  }

  try {
    const context = ImageManipulator.manipulate(image.uri);
    if (resize) context.resize(resize);
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({
      base64: false,
      compress: policy.quality,
      format: output.format === 'png' ? SaveFormat.PNG : SaveFormat.WEBP,
    });
    const processed = new File(result.uri);
    if (!processed.exists || !processed.size) {
      throw new ImageUploadError('PROCESSING_FAILED', 'Não foi possível processar a imagem.');
    }
    if (processed.size > policy.maxOutputBytes) {
      processed.delete();
      throw new ImageUploadError(
        'FILE_TOO_LARGE',
        'A imagem otimizada ainda ficou maior que o limite permitido.',
      );
    }
    return {
      fileName: replaceExtension(image.fileName ?? 'imagem', output.extension),
      height: result.height,
      mimeType: output.mimeType,
      size: processed.size,
      temporary: true,
      uri: result.uri,
      width: result.width,
    };
  } catch (error) {
    if (error instanceof ImageUploadError) throw error;
    throw new ImageUploadError('PROCESSING_FAILED', 'Não foi possível processar esta imagem.');
  }
}

export function cleanupPreparedImage(image: PreparedImage) {
  if (!image.temporary) return;
  const file = new File(image.uri);
  if (file.exists) file.delete();
}

function replaceExtension(fileName: string, extension: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'imagem';
  return `${baseName}.${extension}`;
}

function readImageDimensions(uri: string) {
  return new Promise<{ height: number; width: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ height, width }),
      () => reject(new ImageUploadError('PROCESSING_FAILED', 'Não foi possível ler esta imagem.')),
    );
  });
}
