import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import type { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { resolveMediaAssetPublicUrl } from '../media-assets/media-asset-url.resolver';
import {
  POST_CONTENT_ALLOWED_TAGS,
  POST_CONTENT_MAX_BYTES,
} from './post-content.constants';
import { PostContentSanitizerService } from './post-content-sanitizer.service';

const MEDIA_ASSET_MARKER_ATTRIBUTE = 'data-media-asset-id';

function isSafeImageSource(source: string): boolean {
  for (const character of source) {
    const codePoint = character.charCodeAt(0);
    if (codePoint <= 31 || codePoint === 127) return false;
  }

  if (source.startsWith('/')) {
    return !source.startsWith('//') && !source.includes('\\');
  }

  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return false;
  }

  return (
    ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
  );
}

@Injectable()
export class PostContentRendererService {
  constructor(private readonly sanitizer: PostContentSanitizerService) {}

  render(
    canonicalHtml: string | null | undefined,
    assetsById: ReadonlyMap<string, MediaAsset>,
  ): string | null {
    const sanitized = this.sanitizer.sanitizeOutput(canonicalHtml);
    if (!sanitized) return null;

    const rendered = sanitizeHtml(sanitized, {
      allowedTags: [...POST_CONTENT_ALLOWED_TAGS],
      allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        img: [
          'src',
          'alt',
          'title',
          'width',
          'height',
          'loading',
          'decoding',
          MEDIA_ASSET_MARKER_ATTRIBUTE,
        ],
        th: ['colspan', 'rowspan', 'scope'],
        td: ['colspan', 'rowspan'],
        col: ['span'],
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
      allowProtocolRelative: false,
      transformTags: {
        img: (_tagName, attributes) => {
          const assetId = attributes[MEDIA_ASSET_MARKER_ATTRIBUTE];
          if (!assetId) {
            return { tagName: 'img', attribs: attributes };
          }

          const asset = assetsById.get(assetId);
          if (!asset) {
            return {
              tagName: 'img',
              attribs:
                attributes.alt === undefined ? {} : { alt: attributes.alt },
            };
          }

          let source: string;
          try {
            source = resolveMediaAssetPublicUrl(asset);
          } catch {
            source = '';
          }
          if (!isSafeImageSource(source)) {
            return {
              tagName: 'img',
              attribs:
                attributes.alt === undefined ? {} : { alt: attributes.alt },
            };
          }

          const transformed: Record<string, string> = {
            src: source,
            loading: 'lazy',
            decoding: 'async',
            [MEDIA_ASSET_MARKER_ATTRIBUTE]: asset.id,
          };
          if (attributes.alt !== undefined) {
            transformed.alt = attributes.alt;
          }
          if (asset.width) transformed.width = String(asset.width);
          if (asset.height) transformed.height = String(asset.height);

          return { tagName: 'img', attribs: transformed };
        },
      },
    }).trim();

    if (Buffer.byteLength(rendered, 'utf8') > POST_CONTENT_MAX_BYTES) {
      return null;
    }

    return rendered || null;
  }
}
