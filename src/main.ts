import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { MEDIA_STORAGE_CONFIG } from './cores/storage/storage.module';
import type { MediaStorageConfig } from './configs/media-storage.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const mediaStorageConfig = app.get<MediaStorageConfig>(MEDIA_STORAGE_CONFIG);

  if (mediaStorageConfig.provider === 'local') {
    app.useStaticAssets(mediaStorageConfig.localDirectory, {
      prefix: `${mediaStorageConfig.publicPath}/`,
      index: false,
      redirect: false,
    });
  }
  const allowedOrigins = [process.env.FRONTEND_URL, process.env.CMS_URL].filter(
    (origin): origin is string => Boolean(origin),
  );

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const config = new DocumentBuilder()
    .setTitle('CTG BACKEND API')
    .setDescription('API DOCUMENTATION')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
