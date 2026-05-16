import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Thêm CORS config
  app.enableCors({
    origin: [
      'http://localhost:8081',   // React Native web (Expo default)
      'http://localhost:3000',   // Local web dev
      'http://localhost:19006',  // Expo web
      // Thêm domain production của bạn ở đây
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  const config = new DocumentBuilder()
    .setTitle('NexTime API')
    .setDescription('Productivity app with schedule overlay and AI checklists')
    .setVersion('1.0')
    .addTag('schedule', 'UserSchedule module - Events and Heatmap')
    .addTag('checklist', 'Checklist & AI-Prompt module')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api-docs`);
}
bootstrap();