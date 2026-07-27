import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { MediaAssetReferencesService } from '../media-assets/media-asset-references.service';
import { User } from '../users/entities/user.entity';
import { PostCategory } from './entities/post-category.entity';
import { Post } from './entities/post.entity';
import { PostStatus } from './enums/post.enum';
import { PostContentSanitizerService } from './post-content-sanitizer.service';
import { PostContentRendererService } from './post-content-renderer.service';
import { PostInlineMediaService } from './post-inline-media.service';
import { PostsService } from './posts.service';

function createQueryBuilderMock() {
  return {
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
  };
}

describe('PostsService', () => {
  let service: PostsService;
  let userRepository: { findOne: jest.Mock };
  let categoryRepository: { findOne: jest.Mock };
  let postRepository: {
    createQueryBuilder: jest.Mock;
    manager: { transaction: jest.Mock };
  };
  let mediaReferences: { validateImageSelection: jest.Mock };
  let postInlineMedia: { synchronizeLocale: jest.Mock };

  beforeEach(async () => {
    userRepository = { findOne: jest.fn() };
    categoryRepository = { findOne: jest.fn() };
    postRepository = {
      createQueryBuilder: jest.fn(),
      manager: { transaction: jest.fn() },
    };
    mediaReferences = { validateImageSelection: jest.fn() };
    postInlineMedia = {
      synchronizeLocale: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(PostCategory),
          useValue: categoryRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: postRepository,
        },
        {
          provide: MediaAssetReferencesService,
          useValue: mediaReferences,
        },
        PostContentSanitizerService,
        PostContentRendererService,
        {
          provide: PostInlineMediaService,
          useValue: postInlineMedia,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('filters public lists to published content and omits full HTML bodies', async () => {
    const queryBuilder = createQueryBuilderMock();
    queryBuilder.getManyAndCount.mockResolvedValue([
      [
        {
          id: 'post-1',
          titleEn: 'Published',
          titleVi: 'Published VI',
          slug: 'published',
          category: {
            id: 'category-1',
            nameEn: 'Guides',
            nameVi: 'Guides VI',
            slug: 'guides',
            isActive: true,
          },
          shortDescriptionEn: null,
          shortDescriptionVi: null,
          contentHtmlEn: '<p>Large body</p>',
          contentHtmlVi: null,
          coverImageUrl: null,
          coverImageAsset: null,
          publishedAt: null,
          isFeatured: false,
        },
      ],
      1,
    ]);
    postRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const response = await service.findPublicPosts({
      page: 1,
      limit: 10,
    });

    expect(queryBuilder.where).toHaveBeenCalledWith('post.status = :status', {
      status: PostStatus.PUBLISHED,
    });
    expect(response.data[0]).not.toHaveProperty('contentHtmlEn');
    expect(response.data[0]).not.toHaveProperty('contentUrlEn');
  });

  it('sanitizes bilingual content and validates the selected cover on create', async () => {
    const user = { id: 'user-1' } as unknown as User;
    const category = { id: 'category-1' } as unknown as PostCategory;
    const cover = {
      id: 'asset-1',
      url: '/legacy/cover.png',
      storageProvider: null,
      storageKey: null,
    } as unknown as MediaAsset;
    let savedPost: Post | undefined;
    userRepository.findOne.mockResolvedValue(user);
    categoryRepository.findOne.mockResolvedValue(category);
    mediaReferences.validateImageSelection.mockResolvedValue({
      asset: cover,
      warnings: [],
    });

    const slugQueryBuilder = createQueryBuilderMock();
    slugQueryBuilder.getOne.mockResolvedValue(null);
    const detailQueryBuilder = createQueryBuilderMock();
    detailQueryBuilder.getOne.mockImplementation(() =>
      Promise.resolve(savedPost),
    );
    postRepository.createQueryBuilder
      .mockReturnValueOnce(slugQueryBuilder)
      .mockReturnValue(detailQueryBuilder);

    const transactionRepository = {
      create: jest.fn((input: Partial<Post>) => ({
        ...input,
        id: 'post-1',
        coverImageAssetId: input.coverImageAsset?.id ?? null,
        createdAt: new Date('2026-07-16T00:00:00.000Z'),
        updatedAt: new Date('2026-07-16T00:00:00.000Z'),
      })),
      save: jest.fn().mockImplementation((post: Post) => {
        savedPost = post;
        return Promise.resolve(post);
      }),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Post) return transactionRepository;
        throw new Error('Unexpected repository');
      }),
    };
    postRepository.manager.transaction.mockImplementation(
      (callback: (transactionManager: typeof manager) => Promise<unknown>) =>
        callback(manager),
    );

    const response = await service.createPost(
      {
        titleEn: 'Guide',
        titleVi: 'Guide VI',
        categoryId: category.id,
        contentHtmlEn:
          '<h1>Guide</h1><p onclick="alert(1)">English</p><script>x</script>',
        contentHtmlVi: '<h2>Guide VI</h2><p>Vietnamese</p>',
        coverImageAssetId: cover.id,
        status: PostStatus.PUBLISHED,
      },
      { id: user.id } as AuthenticatedUser,
    );

    expect(savedPost?.contentHtmlEn).toBe('<h2>Guide</h2><p>English</p>');
    expect(savedPost?.contentHtmlVi).toBe('<h2>Guide VI</h2><p>Vietnamese</p>');
    expect(savedPost?.coverImageAsset).toBe(cover);
    expect(response.status).toBe(PostStatus.PUBLISHED);
    expect(mediaReferences.validateImageSelection).toHaveBeenCalledWith(
      cover.id,
      expect.objectContaining({ manager }),
    );
    expect(postInlineMedia.synchronizeLocale).toHaveBeenCalledTimes(2);
  });

  it('uses null to clear content and cover while omission preserves the other locale', async () => {
    const user = { id: 'user-1' } as unknown as User;
    const post = {
      id: 'post-1',
      titleEn: 'Guide',
      titleVi: 'Guide VI',
      slug: 'guide',
      category: {
        id: 'category-1',
        nameEn: 'Guides',
        nameVi: 'Guides VI',
        slug: 'guides',
        isActive: true,
      },
      shortDescriptionEn: null,
      shortDescriptionVi: null,
      contentUrlEn: null,
      contentUrlVi: null,
      contentHtmlEn: '<p>English</p>',
      contentHtmlVi: '<p>Vietnamese</p>',
      coverImageUrl: null,
      coverImageAssetId: 'asset-1',
      coverImageAsset: { id: 'asset-1' },
      publishedAt: null,
      status: PostStatus.DRAFT,
      isFeatured: false,
      displayOrder: 0,
      createdAt: new Date('2026-07-16T00:00:00.000Z'),
      updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    } as unknown as Post;
    userRepository.findOne.mockResolvedValue(user);
    mediaReferences.validateImageSelection.mockResolvedValue({
      asset: null,
      warnings: [],
    });
    const detailQueryBuilder = createQueryBuilderMock();
    detailQueryBuilder.getOne.mockResolvedValue(post);
    postRepository.createQueryBuilder.mockReturnValue(detailQueryBuilder);
    const transactionRepository = {
      save: jest.fn().mockResolvedValue(post),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(transactionRepository),
    };
    postRepository.manager.transaction.mockImplementation(
      (callback: (transactionManager: typeof manager) => Promise<unknown>) =>
        callback(manager),
    );

    const response = await service.updatePost(
      post.id,
      {
        contentHtmlEn: null,
        coverImageAssetId: null,
      },
      { id: user.id } as AuthenticatedUser,
    );

    expect(response.contentHtmlEn).toBeNull();
    expect(response.contentHtmlVi).toBe('<p>Vietnamese</p>');
    expect(post.coverImageAsset).toBeNull();
    expect(postInlineMedia.synchronizeLocale).toHaveBeenCalledTimes(1);
    expect(postInlineMedia.synchronizeLocale).toHaveBeenCalledWith(
      expect.anything(),
      post,
      'en',
      [],
    );
  });

  it('does not expose draft posts through public detail', async () => {
    const queryBuilder = createQueryBuilderMock();
    queryBuilder.getOne.mockResolvedValue(null);
    postRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(
      service.findPublicPostBySlug('draft-post'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'post.status = :status',
      { status: PostStatus.PUBLISHED },
    );
  });
});
