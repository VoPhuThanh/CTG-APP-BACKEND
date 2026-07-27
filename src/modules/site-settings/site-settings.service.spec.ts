import { SiteSettingsService } from './site-settings.service';

describe('SiteSettingsService', () => {
  let service: SiteSettingsService;

  beforeEach(() => {
    service = new SiteSettingsService({} as never, {} as never, {} as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
