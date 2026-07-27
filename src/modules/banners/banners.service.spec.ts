import { BannerPlacement, BannerStatus } from './enums/banner.enum';
import { BannersService } from './banners.service';

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
