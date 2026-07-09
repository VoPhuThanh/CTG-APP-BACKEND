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
import { generateSlug } from '@/cores/utils/slug.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { User } from '../users/entities/user.entity';
import type { PostCategoryCreateDto } from './dtos/create-post-category.dto';
import type { PostCreateDto } from './dtos/create-post.dto';
import type { PostCategoryQueryDto } from './dtos/post-category-query.dto';
import type {
  PostCategoryResponseDto,
  PublicPostCategoryResponseDto,
} from './dtos/post-category.dto';
import type { PostResponseDto, PublicPostResponseDto } from './dtos/post.dto';
import type { PostQueryDto } from './dtos/post-query.dto';
import type { PostCategoryUpdateDto } from './dtos/update-post-category.dto';
import type { PostUpdateDto } from './dtos/update-post.dto';
import { PostCategory } from './entities/post-category.entity';
import { Post } from './entities/post.entity';
import { PostStatus } from './enums/post.enum';
import {
  mapPostCategoriesToPublicResponses,
  mapPostCategoriesToResponses,
  mapPostCategoryToResponse,
  mapPostToPublicResponse,
  mapPostToResponse,
  mapPostsToPublicResponses,
  mapPostsToResponses,
} from './posts.mapper';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(PostCategory)
    private readonly postCategoryRepository: Repository<PostCategory>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
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
  ): Promise<PaginatedResponseDto<PublicPostResponseDto>> {
    const now = new Date();
    const search = query.search?.trim();

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
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
      mapPostsToPublicResponses(posts),
      totalItems,
      query,
    );
  }

  async findPublicPostBySlug(slug: string): Promise<PublicPostResponseDto> {
    const now = new Date();

    const post = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
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

    return mapPostToPublicResponse(post);
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

  async createCategory(
    dto: PostCategoryCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<PostCategoryResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);
    const slug = dto.slug ?? generateSlug(dto.nameEn);

    await this.ensureCategorySlugIsAvailable(slug);

    const category = this.postCategoryRepository.create({
      nameEn: dto.nameEn,
      nameVi: dto.nameVi,
      slug,
      descriptionEn: dto.descriptionEn,
      descriptionVi: dto.descriptionVi,
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder ?? 0,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.postCategoryRepository.save(category);

    return this.findCategory(category.id);
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
    if (dto.displayOrder !== undefined) {
      category.displayOrder = dto.displayOrder;
    }

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
    });
  }

  async findAllPosts(
    query: PostQueryDto,
  ): Promise<PaginatedResponseDto<PostResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
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
      mapPostsToResponses(posts),
      totalItems,
      query,
    );
  }

  async findPost(id: string): Promise<PostResponseDto> {
    const post = await this.findPostEntityById(id);

    return mapPostToResponse(post);
  }

  async createPost(
    dto: PostCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<PostResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);
    const category = await this.findCategoryEntityById(dto.categoryId);
    const slug = dto.slug ?? generateSlug(dto.titleEn);

    await this.ensurePostSlugIsAvailable(slug);

    const post = this.postRepository.create({
      titleEn: dto.titleEn,
      titleVi: dto.titleVi,
      slug,
      category,
      shortDescriptionEn: dto.shortDescriptionEn,
      shortDescriptionVi: dto.shortDescriptionVi,
      contentUrlEn: dto.contentUrlEn,
      contentUrlVi: dto.contentUrlVi,
      coverImageUrl: dto.coverImageUrl,
      publishedAt: this.toOptionalDate(dto.publishedAt),
      status: dto.status ?? PostStatus.DRAFT,
      isFeatured: dto.isFeatured ?? false,
      displayOrder: dto.displayOrder ?? 0,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.postRepository.save(post);

    return this.findPost(post.id);
  }

  async updatePost(
    id: string,
    dto: PostUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<PostResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const post = await this.findPostEntityById(id);

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
    if (dto.coverImageUrl !== undefined) {
      post.coverImageUrl = dto.coverImageUrl;
    }
    if (dto.publishedAt !== undefined) {
      post.publishedAt = this.toOptionalDate(dto.publishedAt);
    }
    if (dto.status !== undefined) post.status = dto.status;
    if (dto.isFeatured !== undefined) post.isFeatured = dto.isFeatured;
    if (dto.displayOrder !== undefined) post.displayOrder = dto.displayOrder;

    post.updatedBy = updater;

    await this.postRepository.save(post);

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
    const post = await this.postRepository.findOne({
      where: {
        id,
      },
      relations: {
        category: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!post) {
      throw AppError.notFound(AppErrorCode.POST_NOT_FOUND);
    }

    return post;
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
