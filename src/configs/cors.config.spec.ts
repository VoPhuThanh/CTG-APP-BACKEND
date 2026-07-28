import { ConfigService } from '@nestjs/config';
import { getCorsOrigins, parseCorsOrigins } from './cors.config';

describe('CORS configuration', () => {
  it('trims, deduplicates, and normalizes exact comma-separated origins', () => {
    expect(
      parseCorsOrigins([
        ' https://cms.example.com,https://public.example.com/ , ',
        'https://cms.example.com',
      ]),
    ).toEqual(['https://cms.example.com', 'https://public.example.com']);
  });

  it.each([
    'https://example.com/admin',
    'https://user@example.com',
    'https://example.com?preview=true',
    '*',
  ])('rejects non-origin value %s', (origin) => {
    expect(() => parseCorsOrigins([origin])).toThrow('CORS_ORIGINS');
  });

  it('uses legacy frontend and CMS variables only as fallbacks', () => {
    const config = new ConfigService({
      FRONTEND_URLS: 'http://localhost:3002',
      CMS_URLS: 'http://localhost:3001',
    });

    expect(getCorsOrigins(config)).toEqual([
      'http://localhost:3002',
      'http://localhost:3001',
    ]);
  });

  it('requires explicit origins in production', () => {
    expect(() =>
      getCorsOrigins(new ConfigService({ NODE_ENV: 'production' })),
    ).toThrow('CORS_ORIGINS');
  });
});
