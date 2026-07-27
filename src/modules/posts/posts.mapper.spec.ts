import { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { MediaAssetType } from '../media-assets/enums/media-asset.enum';
import { PostStatus } from './enums/post.enum';
import { Post } from './entities/post.entity';
import {
  mapPostToListItemResponse,
  mapPostToPublicListItemResponse,
  mapPostToPublicResponse,
  mapPostToResponse,
} from './posts.mapper';

describe('post mappers', () => {
  it('maps bilingual HTML, legacy URLs, and managed cover summaries additively', () => {
    const coverImageAsset = {
      id: 'asset-1',
      name: 'Post cover',
      url: '/media/post-cover.webp',
      type: MediaAssetType.IMAGE,
      altTextEn: 'Training safely',
      altTextVi: null,
      width: 1200,
      height: 630,
      mimeType: 'image/webp',
      isActive: true,
    } as unknown as MediaAsset;
    const inlineMediaAsset = {
      id: 'asset-2',
      name: 'Inline training area',
      url: '/media/inline.webp',
      storageProvider: null,
      storageKey: null,
      type: MediaAssetType.IMAGE,
      altTextEn: 'Training area',
      altTextVi: 'Khu vuc tap luyen',
      width: 1600,
      height: 900,
      mimeType: 'image/webp',
      isActive: true,
    } as unknown as MediaAsset;
    const post = {
      id: 'post-1',
      titleEn: 'Training safely',
      titleVi: 'Tap luyen an toan',
      slug: 'training-safely',
      category: {
        id: 'category-1',
        nameEn: 'Guides',
        nameVi: 'Huong dan',
        slug: 'guides',
        isActive: true,
      },
      shortDescriptionEn: null,
      shortDescriptionVi: null,
      contentUrlEn: '/legacy/training-safely.html',
      contentUrlVi: null,
      contentHtmlEn: '<p>Train safely.</p>',
      contentHtmlVi: '<p>Tap luyen an toan.</p>',
      coverImageUrl: '/legacy/post-cover.jpg',
      coverImageAssetId: coverImageAsset.id,
      coverImageAsset,
      inlineMediaReferences: [
        { mediaAsset: inlineMediaAsset, locale: 'en' },
        { mediaAsset: inlineMediaAsset, locale: 'vi' },
      ],
      publishedAt: null,
      status: PostStatus.PUBLISHED,
      isFeatured: false,
      displayOrder: 0,
      createdAt: new Date('2026-07-16T00:00:00.000Z'),
      updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    } as unknown as Post;

    const internalResponse = mapPostToResponse(post);
    const internalListItem = mapPostToListItemResponse(post);
    const publicResponse = mapPostToPublicResponse(post);
    const publicListItem = mapPostToPublicListItemResponse(post);

    expect(internalResponse.contentUrlEn).toBe('/legacy/training-safely.html');
    expect(internalResponse.contentHtmlEn).toBe('<p>Train safely.</p>');
    expect(internalResponse.coverImageAssetId).toBe(coverImageAsset.id);
    expect(internalResponse.coverImageAsset?.id).toBe(coverImageAsset.id);
    expect(internalResponse.inlineMediaAssets).toHaveLength(1);
    expect(internalResponse.inlineMediaAssets[0].id).toBe(inlineMediaAsset.id);
    expect(publicResponse.contentHtmlVi).toBe('<p>Tap luyen an toan.</p>');
    expect(publicResponse.resolvedContentHtmlVi).toBe(
      '<p>Tap luyen an toan.</p>',
    );
    expect(publicResponse.coverImageAsset?.id).toBe(coverImageAsset.id);
    expect(publicResponse.coverImageAsset?.url).toBe(coverImageAsset.url);
    expect(internalListItem).not.toHaveProperty('contentHtmlEn');
    expect(internalListItem.contentUrlEn).toBe('/legacy/training-safely.html');
    expect(publicListItem).not.toHaveProperty('contentHtmlEn');
    expect(publicListItem).not.toHaveProperty('contentUrlEn');
  });
});
