import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SuccessResponseInterceptor } from './common/interceptors/http-success';
import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  UnauthorizedExceptionFilter,
} from './common/execptions/exceptions';
import { CorsMiddleware } from './middleware/cors.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000'], // Replace with actual frontend URLs
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true, // Include credentials if needed (cookies, etc.)
  });

  // Apply CORS middleware globally
  app.use(CorsMiddleware);

  app.useGlobalPipes(new ValidationPipe()); // Enable validation globally

  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  app.useGlobalFilters(
    new BadRequestExceptionFilter(),
    new UnauthorizedExceptionFilter(),
    new NotFoundExceptionFilter(),
  );

  await app.listen(4000);
}
bootstrap();
