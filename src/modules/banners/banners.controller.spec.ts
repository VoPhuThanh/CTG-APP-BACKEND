import { BannersController } from './banners.controller';
import { BannerPlacement } from './enums/banner.enum';

describe('BannersController', () => {
  const bannersService = {
    findPublicByPlacement: jest.fn(),
    findPublicHeroCarousel: jest.fn(),
  };
  const controller = new BannersController(bannersService as never);

  beforeEach(() => jest.clearAllMocks());

  it('delegates canonical public placement queries', async () => {
    bannersService.findPublicByPlacement.mockResolvedValue([]);

    await controller.findPublicByPlacement({ placement: BannerPlacement.NEWS });

    expect(bannersService.findPublicByPlacement).toHaveBeenCalledWith(
      BannerPlacement.NEWS,
    );
  });

  it('delegates the public contact placement query', async () => {
    bannersService.findPublicByPlacement.mockResolvedValue([]);

    await controller.findPublicByPlacement({
      placement: BannerPlacement.CONTACT,
    });

    expect(bannersService.findPublicByPlacement).toHaveBeenCalledWith(
      BannerPlacement.CONTACT,
    );
  });

  it('preserves the homepage carousel route', async () => {
    bannersService.findPublicHeroCarousel.mockResolvedValue([]);

    await controller.findPublicHeroCarousel();

    expect(bannersService.findPublicHeroCarousel).toHaveBeenCalledTimes(1);
  });
});
