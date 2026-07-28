import { ConfigService } from '@nestjs/config';

export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export interface ApplicationConfig {
  nodeEnv: NodeEnvironment;
  host: string;
  port: number;
  swaggerEnabled: boolean;
}

export function parseBoolean(value: string | undefined, name: string): boolean {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  throw new Error(`${name} must be either true or false.`);
}

function parseNodeEnvironment(value: string | undefined): NodeEnvironment {
  const normalized = value?.trim().toLowerCase() || 'development';

  if (!NODE_ENVIRONMENTS.includes(normalized as NodeEnvironment)) {
    throw new Error(
      `NODE_ENV must be one of: ${NODE_ENVIRONMENTS.join(', ')}.`,
    );
  }

  return normalized as NodeEnvironment;
}

function parseHost(value: string | undefined): string {
  const host = value?.trim() || '0.0.0.0';

  if (
    !host ||
    host.includes('://') ||
    host.includes('/') ||
    host.includes('\\') ||
    /\s/.test(host)
  ) {
    throw new Error('HOST must be a hostname or IP address without a scheme.');
  }

  return host;
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3000);

  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

export function getApplicationConfig(config: ConfigService): ApplicationConfig {
  const nodeEnv = parseNodeEnvironment(config.get<string>('NODE_ENV'));
  const configuredSwagger = config.get<string>('ENABLE_SWAGGER');

  return {
    nodeEnv,
    host: parseHost(config.get<string>('HOST')),
    port: parsePort(config.get<string>('PORT')),
    swaggerEnabled:
      configuredSwagger === undefined
        ? nodeEnv !== 'production'
        : parseBoolean(configuredSwagger, 'ENABLE_SWAGGER'),
  };
}
