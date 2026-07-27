import { Test, TestingModule } from '@nestjs/testing';
import { SiteSettingsController } from './site-settings.controller';

describe('SiteSettingsController', () => {
  let controller: SiteSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiteSettingsController],
    }).compile();

    controller = module.get<SiteSettingsController>(SiteSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
