import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('CTG BACKEND API')
    .setDescription('API DOCUMENTATION')
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  console.log(document);

  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
