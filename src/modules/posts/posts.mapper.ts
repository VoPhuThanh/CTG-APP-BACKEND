import { mapMetadataToResponse } from '@/cores/mappers/metadata.mapper';
import {
  PostCategoryResponseDto,
  PublicPostCategoryResponseDto,
} from './dtos/post-category.dto';
import {
  PostCategorySummaryDto,
  PostResponseDto,
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

export function mapPostToResponse(post: Post): PostResponseDto {
  const dto = new PostResponseDto();

  dto.id = post.id;
  dto.titleEn = post.titleEn;
  dto.titleVi = post.titleVi;
  dto.slug = post.slug;
  dto.category = mapCategoryToSummary(post.category);
  dto.shortDescriptionEn = post.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = post.shortDescriptionVi ?? null;
  dto.contentUrlEn = post.contentUrlEn ?? null;
  dto.contentUrlVi = post.contentUrlVi ?? null;
  dto.contentHtmlEn = post.contentHtmlEn ?? null;
  dto.contentHtmlVi = post.contentHtmlVi ?? null;
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

export function mapPostsToResponses(posts: Post[]): PostResponseDto[] {
  return posts.map(mapPostToResponse);
}

export function mapPostToPublicResponse(post: Post): PublicPostResponseDto {
  const dto = new PublicPostResponseDto();

  dto.id = post.id;
  dto.titleEn = post.titleEn;
  dto.titleVi = post.titleVi;
  dto.slug = post.slug;
  dto.category = mapCategoryToSummary(post.category);
  dto.shortDescriptionEn = post.shortDescriptionEn ?? null;
  dto.shortDescriptionVi = post.shortDescriptionVi ?? null;
  dto.contentUrlEn = post.contentUrlEn ?? null;
  dto.contentUrlVi = post.contentUrlVi ?? null;
  dto.contentHtmlEn = post.contentHtmlEn ?? null;
  dto.contentHtmlVi = post.contentHtmlVi ?? null;
  dto.coverImageUrl = post.coverImageUrl ?? null;
  dto.coverImageAsset = mapMediaAssetToPublicSummary(post.coverImageAsset);
  dto.publishedAt = post.publishedAt ?? null;
  dto.isFeatured = post.isFeatured;

  return dto;
}

export function mapPostsToPublicResponses(
  posts: Post[],
): PublicPostResponseDto[] {
  return posts.map(mapPostToPublicResponse);
}
