import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BannerCreateDto } from './dtos/create-banner.dto';
import { PublicBannerPlacementQueryDto } from './dtos/banner-query.dto';
import { BannerPlacement } from './enums/banner.enum';

describe('banner placement contract', () => {
  it('exposes exactly the canonical placement values', () => {
    expect(Object.values(BannerPlacement)).toEqual([
      'homepage_carousel',
      'club',
      'service',
      'membership',
      'news',
      'contact',
    ]);
  });

  it.each(['homepage_section', 'pricing_page', 'contact_page'])(
    'rejects deprecated placement %s for new writes',
    async (placement) => {
      const dto = plainToInstance(BannerCreateDto, { placement });
      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'placement')).toBe(true);
    },
  );

  it('rejects deprecated placement in the public query', async () => {
    const dto = plainToInstance(PublicBannerPlacementQueryDto, {
      placement: 'pricing_page',
    });

    expect(await validate(dto)).toHaveLength(1);
  });
});
