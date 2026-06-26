import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { I18nService } from './common/i18n/i18n.service.js';

async function bootstrap() {
  const isLocal = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isLocal ? ['log', 'warn', 'error'] : ['error'],
    bodyParser: false,
  });

  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { extended: true });

  const i18n = app.get(I18nService);
  app.useGlobalFilters(new HttpExceptionFilter(i18n));

  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Backend running on http://localhost:${port}`);
}

void bootstrap();
