import { ConfigService } from '@nestjs/config';
import { getApplicationConfig } from './application.config';

describe('application configuration', () => {
  it('uses deployable development defaults', () => {
    expect(
      getApplicationConfig(new ConfigService({ NODE_ENV: 'development' })),
    ).toEqual({
      nodeEnv: 'development',
      host: '0.0.0.0',
      port: 3000,
      swaggerEnabled: true,
    });
  });

  it('disables Swagger by default in production', () => {
    expect(
      getApplicationConfig(
        new ConfigService({
          NODE_ENV: 'production',
          HOST: '0.0.0.0',
          PORT: '8080',
        }),
      ),
    ).toEqual({
      nodeEnv: 'production',
      host: '0.0.0.0',
      port: 8080,
      swaggerEnabled: false,
    });
  });

  it.each([
    [{ PORT: '0' }, 'PORT'],
    [{ HOST: 'https://example.com' }, 'HOST'],
    [{ ENABLE_SWAGGER: 'yes' }, 'ENABLE_SWAGGER'],
  ])('rejects invalid application values', (environment, name) => {
    expect(() => getApplicationConfig(new ConfigService(environment))).toThrow(
      name,
    );
  });
});
