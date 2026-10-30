import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { PreparedPhoto } from '@/lib/types';

/** Longest side sent to the AI. Plenty to recognise food, and a small upload. */
const MAX_SIDE = 1280;
const JPEG_QUALITY = 0.7;

export type PhotoSource = 'camera' | 'library';

export type PickResult =
  | { status: 'ok'; photo: PreparedPhoto }
  | { status: 'canceled' }
  | { status: 'denied' };

export async function pickPhoto(source: PhotoSource): Promise<PickResult> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return { status: 'canceled' };

  return { status: 'ok', photo: await preparePhoto(result.assets[0]) };
}

/** Shrinks the photo to MAX_SIDE and re-encodes it as JPEG with its base64. */
async function preparePhoto(asset: ImagePicker.ImagePickerAsset): Promise<PreparedPhoto> {
  const context = ImageManipulator.manipulate(asset.uri);
  const { width, height } = asset;
  if (width && height && Math.max(width, height) > MAX_SIDE) {
    context.resize(width >= height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }

  const image = await context.renderAsync();
  try {
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY, base64: true });
    if (!saved.base64) throw new Error('The photo could not be encoded');
    return { uri: saved.uri, base64: saved.base64, width: saved.width, height: saved.height };
  } finally {
    context.release();
    image.release();
  }
}
