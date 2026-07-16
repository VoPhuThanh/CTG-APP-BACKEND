import type { SupportedImageMimeType } from '@/configs/media-storage.config';

export interface ImageMetadata {
  mimeType: SupportedImageMimeType;
  extension: 'jpg' | 'png' | 'gif' | 'webp';
  width: number;
  height: number;
}

function isPositiveDimension(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= 0x7fffffff;
}

function assertDimensions(width: number, height: number): void {
  if (!isPositiveDimension(width) || !isPositiveDimension(height)) {
    throw new Error('Image dimensions are invalid.');
  }
}

function inspectPng(buffer: Buffer): ImageMetadata | null {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature)) {
    return null;
  }

  if (
    buffer.readUInt32BE(8) !== 13 ||
    buffer.toString('ascii', 12, 16) !== 'IHDR'
  ) {
    throw new Error('PNG is missing a valid IHDR chunk.');
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  assertDimensions(width, height);

  let offset = 8;
  let foundEnd = false;
  while (offset + 12 <= buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset);
    const nextOffset = offset + 12 + chunkLength;
    if (nextOffset > buffer.length) {
      throw new Error('PNG contains a truncated chunk.');
    }

    if (buffer.toString('ascii', offset + 4, offset + 8) === 'IEND') {
      if (chunkLength !== 0) throw new Error('PNG IEND chunk is invalid.');
      foundEnd = true;
      break;
    }

    offset = nextOffset;
  }

  if (!foundEnd) throw new Error('PNG is missing its IEND chunk.');

  return { mimeType: 'image/png', extension: 'png', width, height };
}

function inspectGif(buffer: Buffer): ImageMetadata | null {
  if (buffer.length < 14) return null;

  const signature = buffer.toString('ascii', 0, 6);
  if (signature !== 'GIF87a' && signature !== 'GIF89a') return null;
  if (buffer.at(-1) !== 0x3b) {
    throw new Error('GIF is missing its trailer.');
  }

  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  assertDimensions(width, height);

  const packedFields = buffer[10];
  let offset = 13;
  if ((packedFields & 0x80) !== 0) {
    offset += 3 * 2 ** ((packedFields & 0x07) + 1);
  }

  let foundImage = false;
  while (offset < buffer.length) {
    const blockType = buffer[offset];

    if (blockType === 0x3b) {
      if (!foundImage || offset !== buffer.length - 1) {
        throw new Error('GIF trailer or image data is invalid.');
      }
      break;
    }

    if (blockType === 0x21) {
      if (offset + 2 > buffer.length) {
        throw new Error('GIF extension is truncated.');
      }
      offset = skipGifSubBlocks(buffer, offset + 2);
      continue;
    }

    if (blockType !== 0x2c || offset + 10 > buffer.length) {
      throw new Error('GIF contains an invalid block.');
    }

    const imageWidth = buffer.readUInt16LE(offset + 5);
    const imageHeight = buffer.readUInt16LE(offset + 7);
    assertDimensions(imageWidth, imageHeight);

    const imagePackedFields = buffer[offset + 9];
    offset += 10;
    if ((imagePackedFields & 0x80) !== 0) {
      offset += 3 * 2 ** ((imagePackedFields & 0x07) + 1);
    }

    if (offset >= buffer.length || buffer[offset] < 2 || buffer[offset] > 8) {
      throw new Error('GIF LZW data is invalid.');
    }

    offset = skipGifSubBlocks(buffer, offset + 1);
    foundImage = true;
  }

  return { mimeType: 'image/gif', extension: 'gif', width, height };
}

function skipGifSubBlocks(buffer: Buffer, initialOffset: number): number {
  let offset = initialOffset;

  while (offset < buffer.length) {
    const blockLength = buffer[offset];
    offset += 1;
    if (blockLength === 0) return offset;
    if (offset + blockLength > buffer.length) {
      throw new Error('GIF data block is truncated.');
    }
    offset += blockLength;
  }

  throw new Error('GIF data block is missing a terminator.');
}

function inspectJpeg(buffer: Buffer): ImageMetadata | null {
  if (
    buffer.length < 4 ||
    buffer[0] !== 0xff ||
    buffer[1] !== 0xd8 ||
    buffer[2] !== 0xff
  ) {
    return null;
  }

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  let offset = 2;
  let width: number | undefined;
  let height: number | undefined;

  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.length) break;

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9) break;
    if (marker === 0xda) {
      const endMarker = buffer.lastIndexOf(Buffer.from([0xff, 0xd9]));
      if (endMarker < offset)
        throw new Error('JPEG is missing its end marker.');
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length)
      throw new Error('JPEG segment is truncated.');

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      throw new Error('JPEG segment length is invalid.');
    }

    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) throw new Error('JPEG frame header is invalid.');
      height = buffer.readUInt16BE(offset + 3);
      width = buffer.readUInt16BE(offset + 5);
      assertDimensions(width, height);
    }

    offset += segmentLength;
  }

  if (!width || !height) throw new Error('JPEG dimensions were not found.');
  if (buffer.lastIndexOf(Buffer.from([0xff, 0xd9])) < 2) {
    throw new Error('JPEG is missing its end marker.');
  }

  return { mimeType: 'image/jpeg', extension: 'jpg', width, height };
}

function inspectWebp(buffer: Buffer): ImageMetadata | null {
  if (
    buffer.length < 30 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return null;
  }

  if (buffer.readUInt32LE(4) + 8 !== buffer.length) {
    throw new Error('WebP RIFF length is invalid.');
  }

  const chunkType = buffer.toString('ascii', 12, 16);
  let width: number;
  let height: number;

  if (chunkType === 'VP8X') {
    width = 1 + buffer.readUIntLE(24, 3);
    height = 1 + buffer.readUIntLE(27, 3);
  } else if (chunkType === 'VP8 ') {
    if (
      buffer.length < 30 ||
      buffer[23] !== 0x9d ||
      buffer[24] !== 0x01 ||
      buffer[25] !== 0x2a
    ) {
      throw new Error('WebP VP8 frame header is invalid.');
    }
    width = buffer.readUInt16LE(26) & 0x3fff;
    height = buffer.readUInt16LE(28) & 0x3fff;
  } else if (chunkType === 'VP8L') {
    if (buffer[20] !== 0x2f) {
      throw new Error('WebP VP8L signature is invalid.');
    }
    const bits = buffer.readUInt32LE(21);
    width = (bits & 0x3fff) + 1;
    height = ((bits >> 14) & 0x3fff) + 1;
  } else {
    throw new Error('WebP image chunk is unsupported.');
  }

  assertDimensions(width, height);
  return { mimeType: 'image/webp', extension: 'webp', width, height };
}

export function inspectImage(buffer: Buffer): ImageMetadata {
  const inspectors = [inspectPng, inspectJpeg, inspectGif, inspectWebp];

  for (const inspect of inspectors) {
    const metadata = inspect(buffer);
    if (metadata) return metadata;
  }

  throw new Error('File content is not a supported raster image.');
}

export function normalizeDeclaredImageMimeType(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized === 'image/jpg' || normalized === 'image/pjpeg'
    ? 'image/jpeg'
    : normalized;
}
