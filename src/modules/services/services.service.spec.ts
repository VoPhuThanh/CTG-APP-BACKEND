import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../users/entities/user.entity';
import { Club } from '../clubs/entities/club.entity';
import { ClubStatus } from '../clubs/enums/club.enum';
import { ServiceVariant } from './entities/service-variant.entity';
import { Service } from './entities/service.entity';
import { ServiceSkillLevel, ServiceStatus } from './enums/service.enum';
import { ServicesService } from './services.service';
import { MediaAsset } from '../media-assets/entities/media-asset.entity';
import {
  MediaAssetType,
  MediaAssetUsage,
} from '../media-assets/enums/media-asset.enum';
import { MediaAssetReferencesService } from '../media-assets/media-asset-references.service';

describe('ServicesService', () => {
  let service: ServicesService;

  const serviceRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };
  const userRepository = {
    findOne: jest.fn(),
  };
  const mediaAssetReferencesService = {
    validateImageSelection: jest.fn(),
  };
  const variantQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };
  const serviceQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };
  const transactionServiceRepository = {
    create: jest.fn((value: Partial<Service>) => value),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const transactionClubRepository = { find: jest.fn() };
  const transactionVariantRepository = {
    create: jest.fn((value: Partial<ServiceVariant>) => value),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn(),
    query: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  const serviceVariantRepository = {
    createQueryBuilder: jest.fn(() => variantQueryBuilder),
    find: jest.fn(),
    findOne: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };

  const user = { id: 'user-1' } as User;
  const currentUser = {
    id: 'user-1',
    username: 'admin',
    role: { id: 'role-1', name: 'system:admin' },
    permissions: [],
  };
  const clubA = {
    id: 'club-a',
    nameEn: 'Alpha Club',
    nameVi: 'Alpha Club',
    slug: 'alpha-club',
    status: ClubStatus.PUBLISHED,
    displayOrder: 2,
  } as Club;
  const clubB = {
    id: 'club-b',
    nameEn: 'Beta Club',
    nameVi: 'Beta Club',
    slug: 'beta-club',
    status: ClubStatus.PUBLISHED,
    displayOrder: 1,
  } as Club;
  const parentService = {
    id: 'service-1',
    nameEn: 'Group Classes',
    nameVi: 'Group Classes',
    slug: 'group-classes',
    status: ServiceStatus.PUBLISHED,
    clubs: [clubA, clubB],
  } as Service;

  const buildVariant = (
    overrides: Partial<ServiceVariant> = {},
  ): ServiceVariant =>
    ({
      id: 'variant-1',
      service: parentService,
      nameEn: 'Strength Foundations',
      nameVi: 'Strength Foundations',
      slug: 'strength-foundations',
      shortDescriptionEn: null,
      shortDescriptionVi: null,
      descriptionEn: null,
      descriptionVi: null,
      imageUrl: '/images/strength-card.jpg',
      bannerImageUrl: '/images/strength-banner.jpg',
      modelImageUrl: 'https://example.com/strength-model.jpg',
      durationMinutes: 45,
      caloriesBurnedMin: 250,
      caloriesBurnedMax: 400,
      skillLevel: ServiceSkillLevel.BEGINNER,
      status: ServiceStatus.PUBLISHED,
      displayOrder: 1,
      isFeatured: false,
      clubs: [clubA],
      ...overrides,
    }) as ServiceVariant;

  beforeEach(async () => {
    jest.clearAllMocks();
    manager.query.mockResolvedValue([]);
    manager.update.mockResolvedValue({ affected: 1 });
    manager.softDelete.mockResolvedValue({ affected: 1 });
    serviceRepository.find.mockResolvedValue([]);
    serviceVariantRepository.find.mockResolvedValue([]);
    serviceRepository.createQueryBuilder.mockReturnValue(serviceQueryBuilder);
    userRepository.findOne.mockResolvedValue(user);
    serviceVariantRepository.findOne.mockResolvedValue(null);
    transactionServiceRepository.findOne.mockResolvedValue(parentService);
    transactionClubRepository.find.mockResolvedValue([clubA]);
    transactionVariantRepository.save.mockImplementation(
      (variant: Partial<ServiceVariant>): Promise<ServiceVariant> =>
        Promise.resolve({
          ...variant,
          id: variant.id ?? 'variant-1',
        } as ServiceVariant),
    );
    manager.getRepository.mockImplementation((entity: unknown): unknown => {
      if (entity === Service) return transactionServiceRepository;
      if (entity === Club) return transactionClubRepository;
      return transactionVariantRepository;
    });
    serviceVariantRepository.manager.transaction.mockImplementation(
      (
        callback: (transactionManager: typeof manager) => Promise<unknown>,
      ): Promise<unknown> => callback(manager),
    );
    serviceRepository.manager.transaction.mockImplementation(
      (
        callback: (transactionManager: typeof manager) => Promise<unknown>,
      ): Promise<unknown> => callback(manager),
    );
    mediaAssetReferencesService.validateImageSelection.mockImplementation(
      (id: string | null | undefined) =>
        Promise.resolve({ asset: id ? { id } : null, warnings: [] }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
        {
          provide: getRepositoryToken(ServiceVariant),
          useValue: serviceVariantRepository,
        },
        {
          provide: MediaAssetReferencesService,
          useValue: mediaAssetReferencesService,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('packages every published variant under its published service without pagination', async () => {
    const variantB = buildVariant({
      id: 'variant-b',
      nameEn: 'Yoga',
      nameVi: 'Yoga VI',
      displayOrder: 2,
      clubs: [clubA, clubB],
    });
    const variantA = buildVariant({
      id: 'variant-a',
      nameEn: 'Strength',
      nameVi: 'Suc manh',
      displayOrder: 1,
      clubs: [clubB],
    });
    const publishedService = {
      ...parentService,
      shortDescriptionEn: 'Classes',
      shortDescriptionVi: 'Lop hoc',
      descriptionEn: 'English description',
      descriptionVi: 'Vietnamese description',
      imageUrl: null,
      imageAsset: null,
      displayOrder: 1,
      isFeatured: false,
      variants: [variantB, variantA, variantA],
    } as unknown as Service;
    const emptyService = {
      ...publishedService,
      id: 'service-2',
      slug: 'personal-training',
      displayOrder: 2,
      variants: [],
    } as Service;
    serviceQueryBuilder.getMany.mockResolvedValue([
      publishedService,
      emptyService,
    ]);

    const result = await service.findPublicServices();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: parentService.id,
        shortDescriptionVi: 'Lop hoc',
        descriptionEn: 'English description',
      }),
    );
    expect(result[0].variants.map((variant) => variant.id)).toEqual([
      'variant-a',
      'variant-b',
    ]);
    expect(result[0].variants[0]).toEqual(
      expect.objectContaining({
        serviceId: parentService.id,
        nameVi: 'Suc manh',
        bannerImageUrl: '/images/strength-banner.jpg',
        modelImageUrl: 'https://example.com/strength-model.jpg',
        clubs: [expect.objectContaining({ id: clubB.id })],
      }),
    );
    expect(result[1].variants).toEqual([]);
    expect(serviceQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'service.variants',
      'variant',
      'variant.status = :variantStatus AND variant.deletedAt IS NULL',
      { variantStatus: ServiceStatus.PUBLISHED },
    );
    expect(serviceQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'variant.clubs',
      'club',
      'club.status = :clubStatus AND club.deletedAt IS NULL',
      { clubStatus: ClubStatus.PUBLISHED },
    );
    expect(serviceQueryBuilder.where).toHaveBeenCalledWith(
      'service.status = :serviceStatus',
      { serviceStatus: ServiceStatus.PUBLISHED },
    );
    expect(serviceQueryBuilder).not.toHaveProperty('take');
    expect(serviceQueryBuilder).not.toHaveProperty('skip');
  });

  it('propagates public services query failures', async () => {
    const queryError = new Error('database unavailable');
    serviceQueryBuilder.getMany.mockRejectedValue(queryError);

    await expect(service.findPublicServices()).rejects.toBe(queryError);
  });

  it('resolves and assigns a managed image when creating a service', async () => {
    const imageAsset = {
      id: 'asset-service',
      name: 'Service card',
      url: '/media/service-card.jpg',
      type: MediaAssetType.IMAGE,
      usage: MediaAssetUsage.SERVICE,
      isActive: true,
    } as MediaAsset;
    const savedService = {
      ...parentService,
      imageAssetId: imageAsset.id,
      imageAsset,
      displayOrder: 0,
      isFeatured: false,
      variants: [],
      createdAt: new Date('2026-07-16T00:00:00.000Z'),
      updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    } as Service;
    serviceRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(savedService);
    transactionServiceRepository.save.mockResolvedValue(savedService);
    mediaAssetReferencesService.validateImageSelection.mockResolvedValue({
      asset: imageAsset,
      warnings: [],
    });
    manager.query.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { id: 'existing-1', displayOrder: 0 },
      { id: 'existing-2', displayOrder: 1 },
    ]);

    const result = await service.create(
      {
        nameEn: parentService.nameEn,
        nameVi: parentService.nameVi,
        imageAssetId: imageAsset.id,
      },
      currentUser,
    );

    expect(
      mediaAssetReferencesService.validateImageSelection,
    ).toHaveBeenCalledWith(
      imageAsset.id,
      expect.objectContaining({
        compatibleUsages: [MediaAssetUsage.GENERAL, MediaAssetUsage.SERVICE],
      }),
    );
    expect(transactionServiceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ imageAsset, displayOrder: 2 }),
    );
    expect(result.imageAssetId).toBe(imageAsset.id);
    expect(result.imageAsset).toEqual(
      expect.objectContaining({ id: imageAsset.id, url: imageAsset.url }),
    );
  });

  it('reorders a complete variant scope independently', async () => {
    const firstId = '11111111-1111-4111-8111-111111111111';
    const secondId = '22222222-2222-4222-8222-222222222222';
    serviceRepository.findOne.mockResolvedValue(parentService);
    manager.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: firstId, displayOrder: 0 },
        { id: secondId, displayOrder: 1 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await service.reorderVariants(
      parentService.id,
      [secondId, firstId],
      currentUser,
    );

    const calls = manager.query.mock.calls as unknown as Array<
      [string, unknown[]?]
    >;
    expect(calls[1][0]).toContain('"service_id" = $1');
    expect(calls[1][1]).toEqual([parentService.id]);
    expect(calls[3][1]).toEqual([[secondId, firstId], currentUser.id]);
  });

  it('compacts a variant scope after soft deletion', async () => {
    const variant = buildVariant({ displayOrder: 1 });
    const remainingId = '22222222-2222-4222-8222-222222222222';
    serviceVariantRepository.findOne.mockResolvedValue(variant);
    manager.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: remainingId, displayOrder: 2 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await service.deleteVariant(parentService.id, variant.id, currentUser);

    expect(manager.softDelete).toHaveBeenCalledWith(ServiceVariant, variant.id);
    const calls = manager.query.mock.calls as unknown as Array<
      [string, unknown[]?]
    >;
    expect(calls[3][1]).toEqual([[remainingId], currentUser.id]);
  });

  it('returns only the requested page of published variants', async () => {
    const query = Object.assign(new PaginationQueryDto(), {
      page: 2,
      limit: 9,
    });
    const variant = {
      id: 'variant-1',
      service: { id: 'service-1' },
      nameEn: 'Strength Foundations',
      nameVi: 'Nền tảng sức mạnh',
      slug: 'strength-foundations',
      shortDescriptionEn: null,
      shortDescriptionVi: null,
      descriptionEn: null,
      descriptionVi: null,
      imageUrl: null,
      durationMinutes: 45,
      caloriesBurnedMin: 250,
      caloriesBurnedMax: 400,
      skillLevel: ServiceSkillLevel.BEGINNER,
      status: ServiceStatus.PUBLISHED,
      displayOrder: 1,
      isFeatured: false,
    } as unknown as ServiceVariant;

    serviceRepository.findOne.mockResolvedValue({ id: 'service-1' });
    variantQueryBuilder.getManyAndCount.mockResolvedValue([[variant], 10]);

    const result = await service.findPublicServiceVariants(
      'group-classes',
      query,
    );

    expect(serviceRepository.findOne).toHaveBeenCalledWith({
      select: { id: true },
      where: {
        slug: 'group-classes',
        status: ServiceStatus.PUBLISHED,
      },
    });
    expect(variantQueryBuilder.skip).toHaveBeenCalledWith(9);
    expect(variantQueryBuilder.take).toHaveBeenCalledWith(9);
    expect(variantQueryBuilder.andWhere).toHaveBeenCalledWith(
      'service.status = :serviceStatus',
      { serviceStatus: ServiceStatus.PUBLISHED },
    );
    expect(variantQueryBuilder.andWhere).toHaveBeenCalledWith(
      'variant.status = :variantStatus',
      { variantStatus: ServiceStatus.PUBLISHED },
    );
    expect(result.data).toEqual([
      expect.objectContaining({
        id: 'variant-1',
        serviceId: 'service-1',
      }),
    ]);
    expect(result.meta).toEqual({
      page: 2,
      limit: 9,
      totalItems: 10,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('rejects an unpublished or unknown service slug', async () => {
    serviceRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findPublicServiceVariants(
        'unknown-service',
        new PaginationQueryDto(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(serviceVariantRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('paginates variant IDs before loading to-many clubs and restores page order', async () => {
    const query = Object.assign(new PaginationQueryDto(), {
      page: 2,
      limit: 2,
    });
    const first = buildVariant({ id: 'variant-1', displayOrder: 1 });
    const second = buildVariant({ id: 'variant-2', displayOrder: 2 });
    serviceRepository.findOne.mockResolvedValue(parentService);
    variantQueryBuilder.getCount.mockResolvedValue(4);
    variantQueryBuilder.getRawMany.mockResolvedValue([
      { id: first.id },
      { id: second.id },
    ]);
    variantQueryBuilder.getMany.mockResolvedValue([second, first]);

    const result = await service.findAllVariants('service-1', query);

    expect(variantQueryBuilder.offset).toHaveBeenCalledWith(2);
    expect(variantQueryBuilder.limit).toHaveBeenCalledWith(2);
    expect(variantQueryBuilder.getManyAndCount).not.toHaveBeenCalled();
    expect(variantQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'variant.clubs',
      'club',
    );
    expect(result.data.map((variant) => variant.id)).toEqual([
      first.id,
      second.id,
    ]);
    expect(result.meta.totalItems).toBe(4);
  });

  it('creates banner/model URLs and inherits service clubs when clubIds is omitted', async () => {
    const savedVariant = buildVariant({ clubs: [clubA, clubB] });
    serviceVariantRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(savedVariant);

    const result = await service.createVariant(
      'service-1',
      {
        nameEn: 'Strength Foundations',
        nameVi: 'Strength Foundations',
        bannerImageUrl: '/images/strength-banner.jpg',
        modelImageUrl: 'https://example.com/strength-model.jpg',
      },
      currentUser,
    );

    expect(transactionVariantRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        bannerImageUrl: '/images/strength-banner.jpg',
        modelImageUrl: 'https://example.com/strength-model.jpg',
        clubs: [clubA, clubB],
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        bannerImageUrl: '/images/strength-banner.jpg',
        modelImageUrl: 'https://example.com/strength-model.jpg',
      }),
    );
  });

  it('resolves a managed image asset for a fixed variant slot', async () => {
    const imageAsset = {
      id: 'asset-1',
      type: MediaAssetType.IMAGE,
      name: 'Variant card',
      url: '/media/variant-card.jpg',
      isActive: true,
    } as MediaAsset;
    const savedVariant = buildVariant({
      imageAssetId: imageAsset.id,
      imageAsset,
    });
    mediaAssetReferencesService.validateImageSelection.mockResolvedValue({
      asset: imageAsset,
      warnings: [],
    });
    serviceVariantRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(savedVariant);

    const result = await service.createVariant(
      'service-1',
      {
        nameEn: 'Strength Foundations',
        nameVi: 'Strength Foundations',
        imageAssetId: imageAsset.id,
      },
      currentUser,
    );

    expect(
      mediaAssetReferencesService.validateImageSelection,
    ).toHaveBeenCalledWith(
      imageAsset.id,
      expect.objectContaining({
        compatibleUsages: [MediaAssetUsage.GENERAL, MediaAssetUsage.SERVICE],
      }),
    );
    expect(transactionVariantRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ imageAsset }),
    );
    expect(result.imageAssetId).toBe(imageAsset.id);
    expect(result.imageAsset).toEqual(
      expect.objectContaining({ id: imageAsset.id, url: imageAsset.url }),
    );
  });

  it('creates with no clubs when clubIds is []', async () => {
    serviceVariantRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(buildVariant({ clubs: [] }));

    await service.createVariant(
      'service-1',
      {
        nameEn: 'Strength Foundations',
        nameVi: 'Strength Foundations',
        clubIds: [],
      },
      currentUser,
    );

    expect(transactionVariantRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ clubs: [] }),
    );
  });

  it('deduplicates and assigns a valid subset of club IDs', async () => {
    serviceVariantRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(buildVariant());

    await service.createVariant(
      'service-1',
      {
        nameEn: 'Strength Foundations',
        nameVi: 'Strength Foundations',
        clubIds: ['club-a', 'club-a'],
      },
      currentUser,
    );

    expect(transactionClubRepository.find).toHaveBeenCalledTimes(1);
    expect(transactionVariantRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ clubs: [clubA] }),
    );
  });

  it('rejects a nonexistent submitted club without saving', async () => {
    transactionClubRepository.find.mockResolvedValue([]);

    await expect(
      service.createVariant(
        'service-1',
        {
          nameEn: 'Strength Foundations',
          nameVi: 'Strength Foundations',
          clubIds: ['missing-club'],
        },
        currentUser,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(transactionVariantRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a club outside the parent service without saving', async () => {
    transactionClubRepository.find.mockResolvedValue([clubB]);
    transactionServiceRepository.findOne.mockResolvedValue({
      ...parentService,
      clubs: [clubA],
    });

    await expect(
      service.createVariant(
        'service-1',
        {
          nameEn: 'Strength Foundations',
          nameVi: 'Strength Foundations',
          clubIds: ['club-b'],
        },
        currentUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transactionVariantRepository.save).not.toHaveBeenCalled();
  });

  it('preserves club assignments when update clubIds is omitted', async () => {
    const variant = buildVariant({ clubs: [clubA] });
    serviceVariantRepository.findOne
      .mockResolvedValueOnce(variant)
      .mockResolvedValueOnce(variant);
    transactionVariantRepository.findOne.mockResolvedValue(variant);

    await service.updateVariant(
      'service-1',
      'variant-1',
      { nameEn: 'Updated strength' },
      currentUser,
    );

    expect(transactionServiceRepository.findOne).not.toHaveBeenCalled();
    expect(transactionVariantRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ clubs: [clubA] }),
    );
  });

  it('clears club assignments when update clubIds is []', async () => {
    const variant = buildVariant({ clubs: [clubA] });
    serviceVariantRepository.findOne
      .mockResolvedValueOnce(variant)
      .mockResolvedValueOnce(buildVariant({ clubs: [] }));
    transactionVariantRepository.findOne.mockResolvedValue(variant);

    await service.updateVariant(
      'service-1',
      'variant-1',
      { clubIds: [] },
      currentUser,
    );

    expect(transactionVariantRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ clubs: [] }),
    );
  });

  it('clears a managed variant image only when imageAssetId is explicit null', async () => {
    const imageAsset = {
      id: 'asset-1',
      name: 'Variant card',
      url: '/media/variant-card.jpg',
      type: MediaAssetType.IMAGE,
      usage: MediaAssetUsage.SERVICE,
      isActive: true,
    } as MediaAsset;
    const variant = buildVariant({
      imageAssetId: imageAsset.id,
      imageAsset,
    });
    serviceVariantRepository.findOne
      .mockResolvedValueOnce(variant)
      .mockResolvedValueOnce(
        buildVariant({ imageAssetId: null, imageAsset: null }),
      );
    transactionVariantRepository.findOne.mockResolvedValue(variant);

    const result = await service.updateVariant(
      'service-1',
      'variant-1',
      { imageAssetId: null },
      currentUser,
    );

    expect(
      mediaAssetReferencesService.validateImageSelection,
    ).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        compatibleUsages: [MediaAssetUsage.GENERAL, MediaAssetUsage.SERVICE],
      }),
    );
    expect(transactionVariantRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ imageAsset: null }),
    );
    expect(result.imageAssetId).toBeNull();
    expect(result.imageAsset).toBeNull();
  });

  it('replaces club assignments when update clubIds are supplied', async () => {
    const variant = buildVariant({ clubs: [clubA] });
    serviceVariantRepository.findOne
      .mockResolvedValueOnce(variant)
      .mockResolvedValueOnce(buildVariant({ clubs: [clubB] }));
    transactionVariantRepository.findOne.mockResolvedValue(variant);
    transactionClubRepository.find.mockResolvedValue([clubB]);

    await service.updateVariant(
      'service-1',
      'variant-1',
      { clubIds: ['club-b'] },
      currentUser,
    );

    expect(transactionVariantRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ clubs: [clubB] }),
    );
  });

  it('returns selected club summaries from internal variant detail', async () => {
    serviceVariantRepository.findOne.mockResolvedValue(
      buildVariant({ clubs: [clubA, clubB] }),
    );

    const result = await service.findVariant('service-1', 'variant-1');

    expect(result.clubs).toEqual([
      expect.objectContaining({ id: 'club-b', status: ClubStatus.PUBLISHED }),
      expect.objectContaining({ id: 'club-a', status: ClubStatus.PUBLISHED }),
    ]);
  });

  it('returns public variant detail with service and published club summaries', async () => {
    variantQueryBuilder.getOne.mockResolvedValue(
      buildVariant({ clubs: [clubA, clubB] }),
    );

    const result = await service.findPublicServiceVariantBySlug(
      'group-classes',
      'strength-foundations',
    );

    expect(result.service).toEqual({
      id: 'service-1',
      nameEn: 'Group Classes',
      nameVi: 'Group Classes',
      slug: 'group-classes',
    });
    expect(result.clubs.map((club) => club.id)).toEqual(['club-b', 'club-a']);
    expect(variantQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'variant.clubs',
      'club',
      'club.status = :clubStatus AND club.deletedAt IS NULL',
      { clubStatus: ClubStatus.PUBLISHED },
    );
  });

  it('keeps an already-assigned inactive image in published variant detail', async () => {
    const inactiveAsset = {
      id: 'asset-inactive',
      url: '/media/inactive-but-assigned.jpg',
      type: MediaAssetType.IMAGE,
      usage: MediaAssetUsage.SERVICE,
      isActive: false,
    } as MediaAsset;
    variantQueryBuilder.getOne.mockResolvedValue(
      buildVariant({
        imageAssetId: inactiveAsset.id,
        imageAsset: inactiveAsset,
      }),
    );

    const result = await service.findPublicServiceVariantBySlug(
      'group-classes',
      'strength-foundations',
    );

    expect(result.imageAsset).toEqual(
      expect.objectContaining({
        id: inactiveAsset.id,
        url: inactiveAsset.url,
      }),
    );
  });

  it.each([
    ['draft service', 'draft-service', 'strength-foundations'],
    ['draft variant', 'group-classes', 'draft-variant'],
    ['variant under another service', 'other-service', 'strength-foundations'],
  ])(
    'returns 404 for unavailable public detail: %s',
    async (_, serviceSlug, variantSlug) => {
      variantQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.findPublicServiceVariantBySlug(serviceSlug, variantSlug),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
});
