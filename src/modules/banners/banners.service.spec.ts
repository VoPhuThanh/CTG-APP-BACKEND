import type { EntityManager, Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import type { MediaAssetReferencesService } from '../media-assets/media-asset-references.service';
import type { User } from '../users/entities/user.entity';
import { BannersService } from './banners.service';
import type { BannerResponseDto } from './dtos/banner.dto';
import { Banner } from './entities/banner.entity';
import { BannerPlacement, BannerStatus } from './enums/banner.enum';

describe('BannersService public placements', () => {
  const getMany = jest.fn();
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany,
  };
  const bannerRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  let service: BannersService;

  beforeEach(() => {
    jest.clearAllMocks();
    getMany.mockResolvedValue([]);
    service = new BannersService(
      {} as never,
      bannerRepository as never,
      {} as never,
    );
  });

  it.each([
    BannerPlacement.CLUB,
    BannerPlacement.SERVICE,
    BannerPlacement.MEMBERSHIP,
    BannerPlacement.NEWS,
    BannerPlacement.CONTACT,
  ])(
    'queries active public %s banners deterministically',
    async (placement) => {
      await expect(service.findPublicByPlacement(placement)).resolves.toEqual(
        [],
      );

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'banner.placement = :placement',
        { placement },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'banner.status = :status',
        { status: BannerStatus.PUBLISHED },
      );
      const lifecycleCalls = queryBuilder.andWhere.mock.calls as Array<
        [string, { now?: unknown }]
      >;
      expect(lifecycleCalls).toEqual(
        expect.arrayContaining([
          [
            '(banner.publishedAt IS NULL OR banner.publishedAt <= :now)',
            { now: expect.any(Date) as unknown },
          ],
          [
            '(banner.expiredAt IS NULL OR banner.expiredAt > :now)',
            { now: expect.any(Date) as unknown },
          ],
        ]),
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'banner.displayOrder',
        'ASC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenNthCalledWith(
        2,
        'banner.id',
        'ASC',
      );
    },
  );

  it('preserves the homepage carousel alias', async () => {
    await service.findPublicHeroCarousel();

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'banner.placement = :placement',
      { placement: BannerPlacement.HOMEPAGE_CAROUSEL },
    );
  });
});

describe('BannersService ordering', () => {
  it('compacts the old placement and appends to the new placement atomically', async () => {
    const currentUser = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    } as AuthenticatedUser;
    const updater = { id: currentUser.id } as User;
    const banner = {
      id: '11111111-1111-4111-8111-111111111111',
      placement: BannerPlacement.HOMEPAGE_CAROUSEL,
      displayOrder: 1,
    } as Banner;
    const destinationRows = [
      {
        id: '22222222-2222-4222-8222-222222222222',
        displayOrder: 0,
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        displayOrder: 1,
      },
    ];
    const sourceRows = [
      {
        id: '44444444-4444-4444-8444-444444444444',
        displayOrder: 0,
      },
    ];
    const transactionalRepository = {
      save: jest.fn().mockResolvedValue(banner),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(transactionalRepository),
      query: jest.fn((sql: string, values?: unknown[]) => {
        if (sql.includes('SELECT "id"')) {
          if (values?.[0] === BannerPlacement.CLUB) {
            return Promise.resolve(destinationRows);
          }
          if (values?.[0] === BannerPlacement.HOMEPAGE_CAROUSEL) {
            return Promise.resolve(sourceRows);
          }
        }

        return Promise.resolve([]);
      }),
    } as unknown as EntityManager & {
      getRepository: jest.Mock;
      query: jest.Mock;
    };
    const bannerRepository = {
      findOne: jest.fn().mockResolvedValue(banner),
      manager: {
        transaction: jest.fn(
          async (work: (transactionManager: EntityManager) => Promise<void>) =>
            work(manager),
        ),
      },
    } as unknown as Repository<Banner> & {
      manager: { transaction: jest.Mock };
    };
    const userRepository = {
      findOne: jest.fn().mockResolvedValue(updater),
    } as unknown as Repository<User>;
    const service = new BannersService(
      userRepository,
      bannerRepository,
      {} as MediaAssetReferencesService,
    );
    const response = { id: banner.id } as BannerResponseDto;
    jest.spyOn(service, 'findOne').mockResolvedValue(response);

    await expect(
      service.update(
        banner.id,
        { placement: BannerPlacement.CLUB },
        currentUser,
      ),
    ).resolves.toBe(response);

    expect(bannerRepository.manager.transaction).toHaveBeenCalledTimes(1);
    expect(transactionalRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: BannerPlacement.CLUB,
        displayOrder: 2,
        updatedBy: updater,
      }),
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('"placement" = $1'),
      [BannerPlacement.HOMEPAGE_CAROUSEL],
    );
  });
});
