
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
  
  // Enable CORS with specific origins
  // Allow Railway preview deployments and production
  const allowedOrigins = [
    'http://localhost:3000',
    'https://www.qaytarme.uz',
    'https://qaytarme.uz',
    'https://qaytarme.vercel.app',
    process.env.CLIENT_URL || 'https://www.qaytarme.uz',
  ];

  // Add Railway preview URLs pattern if CLIENT_URL contains railway
  if (process.env.CLIENT_URL?.includes('railway')) {
    allowedOrigins.push(process.env.CLIENT_URL);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.some(allowed => origin.includes(allowed.replace(/https?:\/\//, '')))) {
        return callback(null, true);
      }
      
      // Allow Railway preview deployments (they have dynamic URLs)
      if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) {
        return callback(null, true);
      }
      
      // Allow Vercel preview deployments
      if (origin.includes('.vercel.app')) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(process.env.PORT || 4000); // Usually backend runs on 4000
}
bootstrap();
