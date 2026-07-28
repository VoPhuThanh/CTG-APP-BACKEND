import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { getApplicationConfig } from './configs/application.config';
import { getCorsOrigins } from './configs/cors.config';
import type { MediaStorageConfig } from './configs/media-storage.config';
import { MEDIA_STORAGE_CONFIG } from './cores/storage/storage.module';

function configureLocalMedia(
  app: NestExpressApplication,
  mediaStorageConfig: MediaStorageConfig,
): void {
  if (mediaStorageConfig.provider !== 'local') return;

  app.useStaticAssets(mediaStorageConfig.localDirectory, {
    prefix: `${mediaStorageConfig.publicPath}/`,
    index: false,
    redirect: false,
  });
}

function configureCors(
  app: NestExpressApplication,
  config: ConfigService,
): void {
  app.enableCors({
    origin: getCorsOrigins(config),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });
}

function configureSwagger(app: NestExpressApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CTG BACKEND API')
    .setDescription('API DOCUMENTATION')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const applicationConfig = getApplicationConfig(config);
  const mediaStorageConfig = app.get<MediaStorageConfig>(MEDIA_STORAGE_CONFIG);

  configureLocalMedia(app, mediaStorageConfig);
  configureCors(app, config);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableShutdownHooks();

  if (applicationConfig.swaggerEnabled) {
    configureSwagger(app);
  }

  await app.listen(applicationConfig.port, applicationConfig.host);
  Logger.log(
    `CTG backend listening on ${applicationConfig.host}:${applicationConfig.port}`,
    'Bootstrap',
  );
}

void bootstrap();
