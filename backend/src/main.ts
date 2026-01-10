
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Serve static files from the root public directory
  app.useStaticAssets(join(process.cwd(), '..', 'public'));

  app.setGlobalPrefix('api');
  app.enableCors(); // Enable CORS for Next.js frontend
  await app.listen(process.env.PORT || 4000); // Usually backend runs on 4000
}
bootstrap();
