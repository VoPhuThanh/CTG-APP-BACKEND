import {
  inspectImage,
  normalizeDeclaredImageMimeType,
} from './image-metadata.util';

describe('image metadata inspection', () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  const gif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    'base64',
  );

  it('reads normalized MIME type and dimensions from image content', () => {
    expect(inspectImage(png)).toEqual({
      mimeType: 'image/png',
      extension: 'png',
      width: 1,
      height: 1,
    });
  });

  it('rejects a matching prefix with a truncated image body', () => {
    expect(() => inspectImage(png.subarray(0, 33))).toThrow(
      'PNG is missing its IEND chunk.',
    );
  });

  it('rejects SVG and arbitrary non-image content', () => {
    expect(() =>
      inspectImage(Buffer.from('<svg><script>alert(1)</script></svg>')),
    ).toThrow('File content is not a supported raster image.');
  });

  it('validates GIF block structure rather than accepting its signature alone', () => {
    expect(inspectImage(gif)).toEqual({
      mimeType: 'image/gif',
      extension: 'gif',
      width: 1,
      height: 1,
    });
    expect(() => inspectImage(gif.subarray(0, 13))).toThrow();
  });

  it('normalizes common JPEG browser MIME aliases', () => {
    expect(normalizeDeclaredImageMimeType('image/jpg')).toBe('image/jpeg');
    expect(normalizeDeclaredImageMimeType('IMAGE/PJPEG')).toBe('image/jpeg');
  });
});
