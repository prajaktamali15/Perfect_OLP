import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ----------------------
  // Serve static folders
  // ----------------------

  // 1️⃣ Serve all uploads
  const uploadsPath = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log('📂 Serving uploads from:', uploadsPath);

  // 2️⃣ Serve lessons specifically (optional but explicit)
  const lessonsPath = join(process.cwd(), 'uploads', 'lessons');
  app.use('/uploads/lessons', express.static(lessonsPath));
  console.log('📂 Serving lesson files from:', lessonsPath);

  // 3️⃣ Serve certificates
  const certificatesPath = join(process.cwd(), 'public', 'certificates');
  app.use('/certificates', express.static(certificatesPath));
  console.log('📂 Serving certificates from:', certificatesPath);

  // ----------------------
  // Swagger Setup
  // ----------------------
  const config = new DocumentBuilder()
    .setTitle('Online Learning API')
    .setDescription('API documentation for Online Learning Platform')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    }) 
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, 
    },
  });
  console.log('📄 Swagger docs available at: http://localhost:4000/api/docs');

  // ----------------------
  // Start server
  // ----------------------
  const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();
