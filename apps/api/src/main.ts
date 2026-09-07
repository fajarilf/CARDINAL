import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// load apps/api/.env for `nest start` (dev/prod); migrate.ts uses --env-file instead
try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on real env vars (e.g. production)
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('CARDINAL API')
    .setDescription('ERD generator backend')
    .setVersion('0.0.1')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3333);
}

void bootstrap();
