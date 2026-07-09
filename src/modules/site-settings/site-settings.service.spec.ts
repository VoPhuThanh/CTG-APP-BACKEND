import { Test, TestingModule } from '@nestjs/testing';
import { SiteSettingsService } from './site-settings.service';

describe('SiteSettingsService', () => {
  let service: SiteSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SiteSettingsService],
    }).compile();

    service = module.get<SiteSettingsService>(SiteSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
