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

describe('ServicesService', () => {
  let service: ServicesService;

  const serviceRepository = {
    findOne: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
  };
  const variantQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };
  const transactionServiceRepository = { findOne: jest.fn() };
  const transactionClubRepository = { find: jest.fn() };
  const transactionVariantRepository = {
    create: jest.fn((value: Partial<ServiceVariant>) => value),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn(),
  };
  const serviceVariantRepository = {
    createQueryBuilder: jest.fn(() => variantQueryBuilder),
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
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
