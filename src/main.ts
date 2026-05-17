import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 8000;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CMCI API')
    .setDescription('API de gestion des rapports et comptes rendus CMCI')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // CORS permissif en développement
  if (process.env.NODE_ENV !== 'production') {
    app.enableCors(); // autorise toutes les origines
  } else {
    app.enableCors({
      origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
      credentials: true,
    });
  }

  // Préfixe global (toutes les routes commencent par /api)
  app.setGlobalPrefix('api');

  await app.listen(port);
  console.log(`🚀 CMCI Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
