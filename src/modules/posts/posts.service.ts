import {
  POST_CATEGORY_SORT_FIELDS,
  POST_SORT_FIELDS,
} from '@/cores/constants/sorting.constant';
import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginationSkip,
  getPaginationTake,
} from '@/cores/pagination/pagination-utils';
import {
  compactCollection,
  getNextDisplayOrder,
  lockOrderingCollections,
  OrderingCollections,
  reorderCollection,
} from '@/cores/ordering/ordering.helper';
import { generateSlug } from '@/cores/utils/slug.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { User } from '../users/entities/user.entity';
import type { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { MediaAssetReferenceSlot } from '../media-assets/enums/media-asset-reference.enum';
import { MediaAssetUsage } from '../media-assets/enums/media-asset.enum';
import { MediaAssetReferencesService } from '../media-assets/media-asset-references.service';
import type { PostCategoryCreateDto } from './dtos/create-post-category.dto';
import type { PostCreateDto } from './dtos/create-post.dto';
import type { PostCategoryQueryDto } from './dtos/post-category-query.dto';
import type {
  PostCategoryResponseDto,
  PublicPostCategoryResponseDto,
} from './dtos/post-category.dto';
import type {
  PostListItemResponseDto,
  PostResponseDto,
  PublicPostListItemResponseDto,
  PublicPostResponseDto,
} from './dtos/post.dto';
import type { PostQueryDto } from './dtos/post-query.dto';
import type { PostCategoryUpdateDto } from './dtos/update-post-category.dto';
import type { PostUpdateDto } from './dtos/update-post.dto';
import { PostCategory } from './entities/post-category.entity';
import { Post } from './entities/post.entity';
import { PostStatus } from './enums/post.enum';
import { PostContentLocale } from './enums/post-content-locale.enum';
import {
  mapPostCategoriesToPublicResponses,
  mapPostCategoriesToResponses,
  mapPostCategoryToResponse,
  mapPostToPublicResponse,
  mapPostToResponse,
  mapPostsToListItemResponses,
  mapPostsToPublicListItemResponses,
} from './posts.mapper';
import { PostContentSanitizerService } from './post-content-sanitizer.service';
import type { SanitizedPostContent } from './post-content-sanitizer.service';
import { PostContentRendererService } from './post-content-renderer.service';
import { PostInlineMediaService } from './post-inline-media.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(PostCategory)
    private readonly postCategoryRepository: Repository<PostCategory>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    private readonly mediaAssetReferencesService: MediaAssetReferencesService,

    private readonly postContentSanitizer: PostContentSanitizerService,

    private readonly postContentRenderer: PostContentRendererService,

    private readonly postInlineMediaService: PostInlineMediaService,
  ) {}

  async findPublicCategories(): Promise<PublicPostCategoryResponseDto[]> {
    const categories = await this.postCategoryRepository
      .createQueryBuilder('category')
      .where('category.isActive = :isActive', { isActive: true })
      .orderBy('category.displayOrder', 'ASC')
      .addOrderBy('category.nameEn', 'ASC')
      .addOrderBy('category.id', 'ASC')
      .getMany();

    return mapPostCategoriesToPublicResponses(categories);
  }

  async findPublicPosts(
    query: PostQueryDto,
  ): Promise<PaginatedResponseDto<PublicPostListItemResponseDto>> {
    const now = new Date();
    const search = query.search?.trim();

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.coverImageAsset', 'coverImageAsset')
      .where('post.status = :status', {
        status: PostStatus.PUBLISHED,
      })
      .andWhere('category.isActive = :isActive', {
        isActive: true,
      })
      .andWhere('(post.publishedAt IS NULL OR post.publishedAt <= :now)', {
        now,
      });

    this.applyPostFilters(queryBuilder, query);

    if (search) {
      queryBuilder.andWhere(
        `(
          post.titleEn ILIKE :search
          OR post.titleVi ILIKE :search
          OR post.slug ILIKE :search
          OR post.shortDescriptionEn ILIKE :search
          OR post.shortDescriptionVi ILIKE :search
          OR category.nameEn ILIKE :search
          OR category.nameVi ILIKE :search
          OR category.slug ILIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('post.isFeatured', 'DESC')
      .addOrderBy('post.displayOrder', 'ASC')
      .addOrderBy('post.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('post.createdAt', 'DESC')
      .addOrderBy('post.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [posts, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapPostsToPublicListItemResponses(posts),
      totalItems,
      query,
    );
  }

  async findPublicPostBySlug(slug: string): Promise<PublicPostResponseDto> {
    const now = new Date();

    const post = await this.postRepository
      .createQueryBuilder('post')
      .addSelect(['post.contentHtmlEn', 'post.contentHtmlVi'])
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.coverImageAsset', 'coverImageAsset')
      .leftJoinAndSelect('post.inlineMediaReferences', 'inlineMediaReferences')
      .leftJoinAndSelect('inlineMediaReferences.mediaAsset', 'inlineMediaAsset')
      .where('post.slug = :slug', { slug })
      .andWhere('post.status = :status', {
        status: PostStatus.PUBLISHED,
      })
      .andWhere('category.isActive = :isActive', {
        isActive: true,
      })
      .andWhere('(post.publishedAt IS NULL OR post.publishedAt <= :now)', {
        now,
      })
      .getOne();

    if (!post) {
      throw AppError.notFound(AppErrorCode.POST_NOT_FOUND);
    }

    return mapPostToPublicResponse(this.renderPostContentForPublic(post));
  }

  async findAllCategories(
    query: PostCategoryQueryDto,
  ): Promise<PaginatedResponseDto<PostCategoryResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.postCategoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.createdBy', 'createdBy')
      .leftJoinAndSelect('category.updatedBy', 'updatedBy');

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', {
        isActive: query.isActive === 'true',
      });
    }

    if (search) {
      queryBuilder.andWhere(
        `(
          category.nameEn ILIKE :search
          OR category.nameVi ILIKE :search
          OR category.slug ILIKE :search
          OR category.descriptionEn ILIKE :search
          OR category.descriptionVi ILIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    if (sortBy && sortBy in POST_CATEGORY_SORT_FIELDS) {
      queryBuilder.orderBy(
        `category.${
          POST_CATEGORY_SORT_FIELDS[
            sortBy as keyof typeof POST_CATEGORY_SORT_FIELDS
          ]
        }`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('category.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('category.createdAt', 'DESC')
      .addOrderBy('category.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [categories, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapPostCategoriesToResponses(categories),
      totalItems,
      query,
    );
  }

  async findCategory(categoryId: string): Promise<PostCategoryResponseDto> {
    const category = await this.findCategoryEntityById(categoryId);

    return mapPostCategoryToResponse(category);
  }

  async findCategoryReorderList(): Promise<PostCategoryResponseDto[]> {
    const categories = await this.postCategoryRepository.find({
      relations: {
        createdBy: true,
        updatedBy: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
      },
    });

    return mapPostCategoriesToResponses(categories);
  }

  async reorderCategories(
    orderedIds: string[],
    currentUser: AuthenticatedUser,
  ): Promise<PostCategoryResponseDto[]> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    await this.postCategoryRepository.manager.transaction(async (manager) => {
      await reorderCollection(
        manager,
        OrderingCollections.postCategories,
        orderedIds,
        updater.id,
      );
    });

    return this.findCategoryReorderList();
  }

  async createCategory(
    dto: PostCategoryCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<PostCategoryResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);
    const slug = dto.slug ?? generateSlug(dto.nameEn);

    await this.ensureCategorySlugIsAvailable(slug);

    let createdCategoryId = '';
    await this.postCategoryRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(PostCategory);
      const displayOrder = await getNextDisplayOrder(
        manager,
        OrderingCollections.postCategories,
      );
      const category = repository.create({
        nameEn: dto.nameEn,
        nameVi: dto.nameVi,
        slug,
        descriptionEn: dto.descriptionEn,
        descriptionVi: dto.descriptionVi,
        isActive: dto.isActive ?? true,
        displayOrder,
        createdBy: creator,
        updatedBy: creator,
      });
      createdCategoryId = (await repository.save(category)).id;
    });

    return this.findCategory(createdCategoryId);
  }

  async updateCategory(
    categoryId: string,
    dto: PostCategoryUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<PostCategoryResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const category = await this.findCategoryEntityById(categoryId);

    if (dto.slug && dto.slug !== category.slug) {
      await this.ensureCategorySlugIsAvailable(dto.slug);
      category.slug = dto.slug;
    }

    if (dto.nameEn !== undefined) category.nameEn = dto.nameEn;
    if (dto.nameVi !== undefined) category.nameVi = dto.nameVi;
    if (dto.descriptionEn !== undefined) {
      category.descriptionEn = dto.descriptionEn;
    }
    if (dto.descriptionVi !== undefined) {
      category.descriptionVi = dto.descriptionVi;
    }
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    category.updatedBy = updater;

    await this.postCategoryRepository.save(category);

    return this.findCategory(category.id);
  }

  async deleteCategory(
    categoryId: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const category = await this.findCategoryEntityById(categoryId);

    const postCount = await this.postRepository.count({
      where: {
        category: {
          id: category.id,
        },
      },
    });

    if (postCount > 0) {
      throw AppError.badRequest(AppErrorCode.POST_CATEGORY_IN_USE);
    }

    await this.postCategoryRepository.manager.transaction(async (manager) => {
      await manager.update(PostCategory, category.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(PostCategory, category.id);
      await compactCollection(
        manager,
        OrderingCollections.postCategories,
        deleter.id,
      );
    });
  }

  async findAllPosts(
    query: PostQueryDto,
  ): Promise<PaginatedResponseDto<PostListItemResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.coverImageAsset', 'coverImageAsset')
      .leftJoinAndSelect('post.createdBy', 'createdBy')
      .leftJoinAndSelect('post.updatedBy', 'updatedBy');

    this.applyPostFilters(queryBuilder, query);

    if (query.status) {
      queryBuilder.andWhere('post.status = :status', {
        status: query.status,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        `(
          post.titleEn ILIKE :search
          OR post.titleVi ILIKE :search
          OR post.slug ILIKE :search
          OR post.shortDescriptionEn ILIKE :search
          OR post.shortDescriptionVi ILIKE :search
          OR post.contentUrlEn ILIKE :search
          OR post.contentUrlVi ILIKE :search
          OR category.nameEn ILIKE :search
          OR category.nameVi ILIKE :search
          OR category.slug ILIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    if (sortBy && sortBy in POST_SORT_FIELDS) {
      queryBuilder.orderBy(
        `post.${POST_SORT_FIELDS[sortBy as keyof typeof POST_SORT_FIELDS]}`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('post.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('post.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('post.createdAt', 'DESC')
      .addOrderBy('post.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [posts, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapPostsToListItemResponses(posts),
      totalItems,
      query,
    );
  }

  async findPost(id: string): Promise<PostResponseDto> {
    const post = await this.findPostEntityById(id);

    return mapPostToResponse(this.sanitizePostContentForOutput(post));
  }

  async findPostReorderList(
    categoryId: string,
  ): Promise<PostListItemResponseDto[]> {
    await this.findCategoryEntityById(categoryId);
    const posts = await this.postRepository.find({
      where: { category: { id: categoryId } },
      relations: {
        category: true,
        coverImageAsset: true,
        createdBy: true,
        updatedBy: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
      },
    });

    return mapPostsToListItemResponses(posts);
  }

  async reorderPosts(
    categoryId: string,
    orderedIds: string[],
    currentUser: AuthenticatedUser,
  ): Promise<PostListItemResponseDto[]> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    await this.findCategoryEntityById(categoryId);
    await this.postRepository.manager.transaction(async (manager) => {
      await reorderCollection(
        manager,
        OrderingCollections.posts(categoryId),
        orderedIds,
        updater.id,
      );
    });

    return this.findPostReorderList(categoryId);
  }

  async createPost(
    dto: PostCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<PostResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);
    const category = await this.findCategoryEntityById(dto.categoryId);
    const slug = dto.slug ?? generateSlug(dto.titleEn);
    const contentHtmlEn = this.postContentSanitizer.sanitizeInputWithMarkers(
      dto.contentHtmlEn,
    );
    const contentHtmlVi = this.postContentSanitizer.sanitizeInputWithMarkers(
      dto.contentHtmlVi,
    );

    await this.ensurePostSlugIsAvailable(slug);
    let createdPostId = '';

    await this.postRepository.manager.transaction(async (manager) => {
      const coverImageAsset = await this.findImageAssetByIdOrThrow(
        dto.coverImageAssetId,
        MediaAssetReferenceSlot.POST_COVER_IMAGE,
        manager,
      );
      const postRepository = manager.getRepository(Post);
      const displayOrder = await getNextDisplayOrder(
        manager,
        OrderingCollections.posts(category.id),
      );
      const post = postRepository.create({
        titleEn: dto.titleEn,
        titleVi: dto.titleVi,
        slug,
        category,
        shortDescriptionEn: dto.shortDescriptionEn,
        shortDescriptionVi: dto.shortDescriptionVi,
        contentUrlEn: dto.contentUrlEn,
        contentUrlVi: dto.contentUrlVi,
        contentHtmlEn: contentHtmlEn.html ?? null,
        contentHtmlVi: contentHtmlVi.html ?? null,
        coverImageUrl: dto.coverImageUrl,
        coverImageAsset,
        publishedAt: this.toOptionalDate(dto.publishedAt),
        status: dto.status ?? PostStatus.DRAFT,
        isFeatured: dto.isFeatured ?? false,
        displayOrder,
        createdBy: creator,
        updatedBy: creator,
      });

      const savedPost = await postRepository.save(post);
      await this.postInlineMediaService.synchronizeLocale(
        manager,
        savedPost,
        PostContentLocale.EN,
        contentHtmlEn.mediaAssetIds,
      );
      await this.postInlineMediaService.synchronizeLocale(
        manager,
        savedPost,
        PostContentLocale.VI,
        contentHtmlVi.mediaAssetIds,
      );
      createdPostId = savedPost.id;
    });

    return this.findPost(createdPostId);
  }

  async updatePost(
    id: string,
    dto: PostUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<PostResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const post = await this.findPostEntityById(id);
    const previousCategoryId = post.category.id;
    const contentHtmlEn = this.sanitizeUpdatedPostContent(dto.contentHtmlEn);
    const contentHtmlVi = this.sanitizeUpdatedPostContent(dto.contentHtmlVi);

    if (dto.slug && dto.slug !== post.slug) {
      await this.ensurePostSlugIsAvailable(dto.slug);
      post.slug = dto.slug;
    }

    if (dto.categoryId !== undefined) {
      post.category = await this.findCategoryEntityById(dto.categoryId);
    }

    if (dto.titleEn !== undefined) post.titleEn = dto.titleEn;
    if (dto.titleVi !== undefined) post.titleVi = dto.titleVi;
    if (dto.shortDescriptionEn !== undefined) {
      post.shortDescriptionEn = dto.shortDescriptionEn;
    }
    if (dto.shortDescriptionVi !== undefined) {
      post.shortDescriptionVi = dto.shortDescriptionVi;
    }
    if (dto.contentUrlEn !== undefined) post.contentUrlEn = dto.contentUrlEn;
    if (dto.contentUrlVi !== undefined) post.contentUrlVi = dto.contentUrlVi;
    if (dto.contentHtmlEn !== undefined) {
      post.contentHtmlEn = contentHtmlEn?.html ?? null;
    }
    if (dto.contentHtmlVi !== undefined) {
      post.contentHtmlVi = contentHtmlVi?.html ?? null;
    }
    if (dto.coverImageUrl !== undefined) {
      post.coverImageUrl = dto.coverImageUrl;
    }
    if (dto.publishedAt !== undefined) {
      post.publishedAt = this.toOptionalDate(dto.publishedAt);
    }
    if (dto.status !== undefined) post.status = dto.status;
    if (dto.isFeatured !== undefined) post.isFeatured = dto.isFeatured;

    post.updatedBy = updater;

    await this.postRepository.manager.transaction(async (manager) => {
      const categoryChanged = previousCategoryId !== post.category.id;
      if (categoryChanged) {
        await lockOrderingCollections(manager, [
          OrderingCollections.posts(previousCategoryId),
          OrderingCollections.posts(post.category.id),
        ]);
        post.displayOrder = await getNextDisplayOrder(
          manager,
          OrderingCollections.posts(post.category.id),
        );
      }

      if (dto.coverImageAssetId !== undefined) {
        post.coverImageAsset = await this.findImageAssetByIdOrThrow(
          dto.coverImageAssetId,
          MediaAssetReferenceSlot.POST_COVER_IMAGE,
          manager,
        );
      }

      await manager.getRepository(Post).save(post);
      if (categoryChanged) {
        await compactCollection(
          manager,
          OrderingCollections.posts(previousCategoryId),
          updater.id,
        );
      }
      if (contentHtmlEn) {
        await this.postInlineMediaService.synchronizeLocale(
          manager,
          post,
          PostContentLocale.EN,
          contentHtmlEn.mediaAssetIds,
        );
      }
      if (contentHtmlVi) {
        await this.postInlineMediaService.synchronizeLocale(
          manager,
          post,
          PostContentLocale.VI,
          contentHtmlVi.mediaAssetIds,
        );
      }
    });

    return this.findPost(post.id);
  }

  async deletePost(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const post = await this.findPostEntityById(id);

    await this.postRepository.manager.transaction(async (manager) => {
      await manager.update(Post, post.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(Post, post.id);
      await compactCollection(
        manager,
        OrderingCollections.posts(post.category.id),
        deleter.id,
      );
    });
  }

  private applyPostFilters(
    queryBuilder: ReturnType<Repository<Post>['createQueryBuilder']>,
    query: PostQueryDto,
  ): void {
    if (query.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.categorySlug) {
      queryBuilder.andWhere('category.slug = :categorySlug', {
        categorySlug: query.categorySlug,
      });
    }

    if (query.isFeatured !== undefined) {
      queryBuilder.andWhere('post.isFeatured = :isFeatured', {
        isFeatured: query.isFeatured === 'true',
      });
    }
  }

  private async findCategoryEntityById(
    categoryId: string,
  ): Promise<PostCategory> {
    const category = await this.postCategoryRepository.findOne({
      where: {
        id: categoryId,
      },
      relations: {
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!category) {
      throw AppError.notFound(AppErrorCode.POST_CATEGORY_NOT_FOUND);
    }

    return category;
  }

  private async findPostEntityById(id: string): Promise<Post> {
    const post = await this.postRepository
      .createQueryBuilder('post')
      .addSelect(['post.contentHtmlEn', 'post.contentHtmlVi'])
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.coverImageAsset', 'coverImageAsset')
      .leftJoinAndSelect('post.inlineMediaReferences', 'inlineMediaReferences')
      .leftJoinAndSelect('inlineMediaReferences.mediaAsset', 'inlineMediaAsset')
      .leftJoinAndSelect('post.createdBy', 'createdBy')
      .leftJoinAndSelect('post.updatedBy', 'updatedBy')
      .where('post.id = :id', { id })
      .getOne();

    if (!post) {
      throw AppError.notFound(AppErrorCode.POST_NOT_FOUND);
    }

    return post;
  }

  private sanitizePostContentForOutput(post: Post): Post {
    post.contentHtmlEn = this.postContentSanitizer.sanitizeOutput(
      post.contentHtmlEn,
    );
    post.contentHtmlVi = this.postContentSanitizer.sanitizeOutput(
      post.contentHtmlVi,
    );

    return post;
  }

  private renderPostContentForPublic(post: Post): Post {
    const assetsById = new Map(
      (post.inlineMediaReferences ?? [])
        .filter((reference) => reference.mediaAsset)
        .map((reference) => [reference.mediaAsset.id, reference.mediaAsset]),
    );
    post.contentHtmlEn = this.postContentRenderer.render(
      post.contentHtmlEn,
      assetsById,
    );
    post.contentHtmlVi = this.postContentRenderer.render(
      post.contentHtmlVi,
      assetsById,
    );

    return post;
  }

  private sanitizeUpdatedPostContent(
    value: string | null | undefined,
  ): SanitizedPostContent | null {
    if (value === undefined) return null;

    const result = this.postContentSanitizer.sanitizeInputWithMarkers(value);
    return {
      html: result.html ?? null,
      mediaAssetIds: result.mediaAssetIds,
    };
  }

  private async findCurrentUserOrThrow(
    currentUser: AuthenticatedUser,
  ): Promise<User> {
    if (!currentUser?.id) {
      throw AppError.unauthorized(AppErrorCode.AUTH_REQUIRED);
    }

    const user = await this.userRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });

    if (!user) {
      throw AppError.unauthorized(AppErrorCode.CURRENT_USER_NOT_FOUND);
    }

    return user;
  }

  private async findImageAssetByIdOrThrow(
    id: string | null | undefined,
    slot: MediaAssetReferenceSlot,
    manager?: EntityManager,
  ): Promise<MediaAsset | null> {
    const result =
      await this.mediaAssetReferencesService.validateImageSelection(id, {
        manager,
        slot,
        compatibleUsages: [MediaAssetUsage.GENERAL, MediaAssetUsage.POST],
      });

    return result.asset;
  }

  private async ensureCategorySlugIsAvailable(slug: string): Promise<void> {
    const existingCategory = await this.postCategoryRepository
      .createQueryBuilder('category')
      .withDeleted()
      .where('category.slug = :slug', { slug })
      .getOne();

    if (existingCategory) {
      throw AppError.conflict(AppErrorCode.POST_CATEGORY_SLUG_ALREADY_EXISTS);
    }
  }

  private async ensurePostSlugIsAvailable(slug: string): Promise<void> {
    const existingPost = await this.postRepository
      .createQueryBuilder('post')
      .withDeleted()
      .where('post.slug = :slug', { slug })
      .getOne();

    if (existingPost) {
      throw AppError.conflict(AppErrorCode.POST_SLUG_ALREADY_EXISTS);
    }
  }

  private toOptionalDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    return new Date(value);
  }
}
