import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import {
  PostCategoryResponseDto,
  PublicPostCategoryResponseDto,
} from './dtos/post-category.dto';
import {
  PostCategorySummaryDto,
  PostListItemResponseDto,
  PostResponseDto,
  PublicPostListItemResponseDto,
  PublicPostResponseDto,
} from './dtos/post.dto';
import { PostCategory } from './entities/post-category.entity';
import { Post } from './entities/post.entity';
import {
  mapMediaAssetToPublicSummary,
  mapMediaAssetToSummary,
} from '../media-assets/media-assets.mapper';

function mapCategoryToSummary(category: PostCategory): PostCategorySummaryDto {
  const dto = new PostCategorySummaryDto();

  dto.id = category.id;
  dto.nameEn = category.nameEn;
  dto.nameVi = category.nameVi;
  dto.slug = category.slug;
  dto.isActive = category.isActive;

  return dto;
}

export function mapPostCategoryToResponse(
  category: PostCategory,
): PostCategoryResponseDto {
  const dto = new PostCategoryResponseDto();

  dto.id = category.id;
  dto.nameEn = category.nameEn;
  dto.nameVi = category.nameVi;
  dto.slug = category.slug;
  dto.descriptionEn = category.descriptionEn ?? null;
  dto.descriptionVi = category.descriptionVi ?? null;
  dto.isActive = category.isActive;
  dto.displayOrder = category.displayOrder;
  dto.metadata = mapMetadataToResponse(category);

  return dto;
}

export function mapPostCategoriesToResponses(
  categories: PostCategory[],
): PostCategoryResponseDto[] {
  return categories.map(mapPostCategoryToResponse);
}

export function mapPostCategoryToPublicResponse(
  category: PostCategory,
): PublicPostCategoryResponseDto {
  const dto = new PublicPostCategoryResponseDto();

  dto.id = category.id;
  dto.nameEn = category.nameEn;
  dto.nameVi = category.nameVi;
  dto.slug = category.slug;
  dto.descriptionEn = category.descriptionEn ?? null;
  dto.descriptionVi = category.descriptionVi ?? null;

  return dto;
}

export function mapPostCategoriesToPublicResponses(
  categories: PostCategory[],
): PublicPostCategoryResponseDto[] {
  return categories.map(mapPostCategoryToPublicResponse);
}

export function mapPostToListItemResponse(post: Post): PostListItemResponseDto {
  const dto = new PostListItemResponseDto();

  dto.id = post.id;
  dto.titleEn = post.titleEn;
  dto.titleVi = post.titleVi;
  dto.slug = post.slug;
  dto.category = mapCategoryToSummary(post.category);
  dto.shortDescriptionEn = post.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = post.shortDescriptionVi ?? null;
  dto.contentUrlEn = post.contentUrlEn ?? null;
  dto.contentUrlVi = post.contentUrlVi ?? null;
  dto.coverImageUrl = post.coverImageUrl ?? null;
  dto.coverImageAssetId = post.coverImageAssetId ?? null;
  dto.coverImageAsset = mapMediaAssetToSummary(post.coverImageAsset);
  dto.publishedAt = post.publishedAt ?? null;
  dto.status = post.status;
  dto.isFeatured = post.isFeatured;
  dto.displayOrder = post.displayOrder;
  dto.metadata = mapMetadataToResponse(post);

  return dto;
}

export function mapPostToResponse(post: Post): PostResponseDto {
  const dto = Object.assign(
    new PostResponseDto(),
    mapPostToListItemResponse(post),
  );

  dto.contentHtmlEn = post.contentHtmlEn ?? null;
  dto.contentHtmlVi = post.contentHtmlVi ?? null;
  const uniqueInlineAssets = new Map(
    (post.inlineMediaReferences ?? [])
      .filter((reference) => reference.mediaAsset)
      .map((reference) => [reference.mediaAsset.id, reference.mediaAsset]),
  );
  dto.inlineMediaAssets = [...uniqueInlineAssets.values()]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((asset) => mapMediaAssetToSummary(asset))
    .filter((asset): asset is NonNullable<typeof asset> => asset !== null);

  return dto;
}

export function mapPostsToListItemResponses(
  posts: Post[],
): PostListItemResponseDto[] {
  return posts.map(mapPostToListItemResponse);
}

export function mapPostToPublicListItemResponse(
  post: Post,
): PublicPostListItemResponseDto {
  const dto = new PublicPostListItemResponseDto();

  dto.id = post.id;
  dto.titleEn = post.titleEn;
  dto.titleVi = post.titleVi;
  dto.slug = post.slug;
  dto.category = mapCategoryToSummary(post.category);
  dto.shortDescriptionEn = post.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = post.shortDescriptionVi ?? null;
  dto.coverImageUrl = post.coverImageUrl ?? null;
  dto.coverImageAsset = mapMediaAssetToPublicSummary(post.coverImageAsset);
  dto.publishedAt = post.publishedAt ?? null;
  dto.isFeatured = post.isFeatured;

  return dto;
}

export function mapPostToPublicResponse(post: Post): PublicPostResponseDto {
  const dto = Object.assign(
    new PublicPostResponseDto(),
    mapPostToPublicListItemResponse(post),
  );

  dto.contentUrlEn = post.contentUrlEn ?? null;
  dto.contentUrlVi = post.contentUrlVi ?? null;
  dto.contentHtmlEn = post.contentHtmlEn ?? null;
  dto.contentHtmlVi = post.contentHtmlVi ?? null;
  dto.resolvedContentHtmlEn = dto.contentHtmlEn;
  dto.resolvedContentHtmlVi = dto.contentHtmlVi;

  return dto;
}

export function mapPostsToPublicListItemResponses(
  posts: Post[],
): PublicPostListItemResponseDto[] {
  return posts.map(mapPostToPublicListItemResponse);
}
