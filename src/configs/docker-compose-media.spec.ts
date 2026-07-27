import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Docker Compose media persistence', () => {
  const compose = readFileSync(
    resolve(process.cwd(), 'docker-compose.yml'),
    'utf8',
  );

  it('preserves the PostgreSQL volume and adds persistent MinIO storage', () => {
    expect(compose).toContain('- postgres_data:/var/lib/postgresql/data');
    expect(compose).toContain('postgres_data:');
    expect(compose).toContain('- minio_data:/data');
    expect(compose).toContain('minio_data:');
  });

  it('separates API/console ports and health-gates idempotent bucket setup', () => {
    expect(compose).toContain("'9000:9000'");
    expect(compose).toContain("'9001:9001'");
    expect(compose).toContain("['CMD', 'mc', 'ready', 'local']");
    expect(compose).toContain('condition: service_healthy');
    expect(compose).toContain('mc mb --ignore-existing');
  });
});
