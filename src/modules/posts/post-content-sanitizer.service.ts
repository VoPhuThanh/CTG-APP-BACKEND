import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import sanitizeHtml from 'sanitize-html';

import {
  POST_CONTENT_ALLOWED_TAGS,
  POST_CONTENT_MAX_BYTES,
} from './post-content.constants';

const SAFE_FRAGMENT = /^#[A-Za-z][A-Za-z0-9:._-]*$/;
const SAFE_DIMENSION = /^[1-9]\d{0,4}$/;
const MEDIA_ASSET_MARKER_ATTRIBUTE = 'data-media-asset-id';

export interface SanitizedPostContent {
  html: string | null;
  mediaAssetIds: string[];
}

@Injectable()
export class PostContentSanitizerService {
  sanitizeInput(value: string | null | undefined): string | null | undefined {
    return this.sanitizeInputWithMarkers(value).html;
  }

  sanitizeInputWithMarkers(value: string | null | undefined): {
    html: string | null | undefined;
    mediaAssetIds: string[];
  } {
    if (value === undefined || value === null) {
      return { html: value, mediaAssetIds: [] };
    }

    this.assertWithinSizeLimit(value);
    const result = this.sanitizeFragment(value, true);
    const sanitized = result.html.trim();
    this.assertWithinSizeLimit(sanitized);

    return {
      html: sanitized || null,
      mediaAssetIds: result.mediaAssetIds,
    };
  }

  sanitizeOutput(value: string | null | undefined): string | null {
    if (!value) return null;

    this.assertWithinSizeLimit(value);
    const sanitized = this.sanitizeFragment(value, false).html.trim();
    this.assertWithinSizeLimit(sanitized);

    return sanitized || null;
  }

  private sanitizeFragment(
    value: string,
    rejectInvalidMarkers: boolean,
  ): { html: string; mediaAssetIds: string[] } {
    const mediaAssetIds = new Set<string>();
    let invalidMarkerFound = false;

    const html = sanitizeHtml(value, {
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
      nonTextTags: [
        'script',
        'style',
        'textarea',
        'option',
        'iframe',
        'object',
        'embed',
        'form',
        'template',
        'svg',
        'math',
        'head',
      ],
      transformTags: {
        h1: 'h2',
        a: (_tagName, attributes) => {
          const href = this.normalizeLink(attributes.href);
          const transformed: Record<string, string> = {};

          if (href) transformed.href = href;
          if (attributes.title?.trim()) {
            transformed.title = attributes.title.trim();
          }

          if (href && this.isExternalWebLink(href)) {
            transformed.target = '_blank';
            transformed.rel = 'noopener noreferrer';
          }

          return { tagName: 'a', attribs: transformed };
        },
        img: (_tagName, attributes) => {
          if (
            Object.prototype.hasOwnProperty.call(
              attributes,
              MEDIA_ASSET_MARKER_ATTRIBUTE,
            )
          ) {
            const assetId =
              attributes[MEDIA_ASSET_MARKER_ATTRIBUTE]?.trim() ?? '';

            if (!isUUID(assetId)) {
              invalidMarkerFound = true;
              return { tagName: 'img', attribs: {} };
            }

            mediaAssetIds.add(assetId);
            const transformed: Record<string, string> = {
              [MEDIA_ASSET_MARKER_ATTRIBUTE]: assetId,
            };
            if (attributes.alt !== undefined) {
              transformed.alt = attributes.alt.trim();
            }

            return { tagName: 'img', attribs: transformed };
          }

          const source = this.normalizeImageSource(attributes.src);
          if (!source) return { tagName: 'img', attribs: {} };

          const transformed: Record<string, string> = {
            src: source,
            loading: 'lazy',
            decoding: 'async',
          };

          if (attributes.alt !== undefined) transformed.alt = attributes.alt;
          if (attributes.title?.trim()) {
            transformed.title = attributes.title.trim();
          }
          if (attributes.width && SAFE_DIMENSION.test(attributes.width)) {
            transformed.width = attributes.width;
          }
          if (attributes.height && SAFE_DIMENSION.test(attributes.height)) {
            transformed.height = attributes.height;
          }

          return { tagName: 'img', attribs: transformed };
        },
      },
    });

    if (invalidMarkerFound && rejectInvalidMarkers) {
      throw AppError.badRequest(AppErrorCode.POST_INLINE_MEDIA_MARKER_INVALID);
    }

    return { html, mediaAssetIds: [...mediaAssetIds] };
  }

  private normalizeLink(value?: string): string | null {
    const link = value?.trim();
    if (!link || this.hasControlCharacter(link) || link.startsWith('//')) {
      return null;
    }

    if (SAFE_FRAGMENT.test(link)) return link;
    if (link.startsWith('/') && !link.startsWith('//')) return link;

    try {
      const parsed = new URL(link);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        if (parsed.username || parsed.password) return null;
        return parsed.toString();
      }
      if (parsed.protocol === 'mailto:' || parsed.protocol === 'tel:') {
        return link;
      }
    } catch {
      return null;
    }

    return null;
  }

  private normalizeImageSource(value?: string): string | null {
    const source = value?.trim();
    if (
      !source ||
      this.hasControlCharacter(source) ||
      source.startsWith('//')
    ) {
      return null;
    }

    if (source.startsWith('/') && !source.startsWith('//')) return source;

    try {
      const parsed = new URL(source);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  private isExternalWebLink(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private hasControlCharacter(value: string): boolean {
    return [...value].some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    });
  }

  private assertWithinSizeLimit(value: string): void {
    if (Buffer.byteLength(value, 'utf8') > POST_CONTENT_MAX_BYTES) {
      throw AppError.payloadTooLarge(AppErrorCode.POST_CONTENT_TOO_LARGE);
    }
  }
}
