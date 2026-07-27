import type { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { MediaAssetType } from '../media-assets/enums/media-asset.enum';
import { PostContentRendererService } from './post-content-renderer.service';
import { PostContentSanitizerService } from './post-content-sanitizer.service';

describe('PostContentRendererService', () => {
  const assetId = '5e8e7b84-56cb-4db1-82ba-33f1a740a9e1';

  it('resolves canonical markers with current safe URLs and dimensions', () => {
    const renderer = new PostContentRendererService(
      new PostContentSanitizerService(),
    );
    const asset = {
      id: assetId,
      url: null,
      storageProvider: 'local',
      bucket: null,
      storageKey: 'posts/2026/07/training.webp',
      type: MediaAssetType.IMAGE,
      width: 1600,
      height: 900,
    } as MediaAsset;

    const result = renderer.render(
      `<figure><img data-media-asset-id="${assetId}" src="https://evil.example/x" alt="Training"><figcaption>Caption</figcaption></figure>`,
      new Map([[assetId, asset]]),
    );

    expect(result).toContain(
      'src="/uploads/media/posts/2026/07/training.webp"',
    );
    expect(result).toContain('loading="lazy"');
    expect(result).toContain('width="1600"');
    expect(result).toContain('height="900"');
    expect(result).toContain(`data-media-asset-id="${assetId}"`);
    expect(result).toContain('<figcaption>Caption</figcaption>');
    expect(result).not.toContain('evil.example');
  });

  it('removes impossible missing markers without emitting broken URLs', () => {
    const renderer = new PostContentRendererService(
      new PostContentSanitizerService(),
    );
    const result = renderer.render(
      `<p>Before</p><img data-media-asset-id="${assetId}" alt="Missing"><p>After</p>`,
      new Map(),
    );

    expect(result).toBe('<p>Before</p><img alt="Missing" /><p>After</p>');
    expect(result).not.toContain('src=');
  });

  it('preserves transitional external assets through the compatibility URL', () => {
    const renderer = new PostContentRendererService(
      new PostContentSanitizerService(),
    );
    const asset = {
      id: assetId,
      url: 'https://cdn.example.com/posts/training.webp',
      storageProvider: null,
      bucket: null,
      storageKey: null,
      type: MediaAssetType.IMAGE,
      width: 1200,
      height: 800,
    } as MediaAsset;

    const result = renderer.render(
      `<img data-media-asset-id="${assetId}" alt="External">`,
      new Map([[assetId, asset]]),
    );

    expect(result).toContain(
      'src="https://cdn.example.com/posts/training.webp"',
    );
    expect(result).toContain(`data-media-asset-id="${assetId}"`);
  });

  it('does not render unsafe compatibility URLs', () => {
    const renderer = new PostContentRendererService(
      new PostContentSanitizerService(),
    );
    const asset = {
      id: assetId,
      url: 'javascript:alert(1)',
      storageProvider: null,
      bucket: null,
      storageKey: null,
      type: MediaAssetType.IMAGE,
    } as MediaAsset;

    const result = renderer.render(
      `<img data-media-asset-id="${assetId}" alt="Unsafe">`,
      new Map([[assetId, asset]]),
    );

    expect(result).toBe('<img alt="Unsafe" />');
    expect(result).not.toContain('src=');
  });
});
